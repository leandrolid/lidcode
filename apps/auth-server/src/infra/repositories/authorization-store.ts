import { createHash } from 'node:crypto'
import { and, desc, eq, gt, isNotNull, isNull, sql } from 'drizzle-orm'
import type { createDatabase } from '../adapters/drizzle/client.js'
import {
  appAuthorizations,
  authorizationBindings,
  oauthAccessToken,
  oauthClient,
  oauthClientResource,
  oauthConsent,
  oauthRefreshToken,
  oauthResource,
} from '../adapters/drizzle/schemas/index.js'

type Database = ReturnType<typeof createDatabase>['database']
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
export type CredentialKind = typeof authorizationBindings.$inferInsert.kind

export function credentialDigest(credential: string) {
  return createHash('sha256').update(credential).digest('hex')
}

async function lockUserClient(transaction: Transaction, userId: string, clientId: string) {
  // Pair locking also serializes first approval, where no lifecycle row exists yet.
  await transaction.execute(
    sql`SELECT pg_advisory_xact_lock(hashtextextended(${JSON.stringify([userId, clientId])}, 0))`,
  )
}

export function createAuthorizationStore(database: Database) {
  return {
    async list(userId: string) {
      return database
        .select({
          authorizationId: appAuthorizations.id,
          clientId: appAuthorizations.clientId,
          name: oauthClient.name,
          scopes: appAuthorizations.scopes,
          approvedAt: appAuthorizations.approvedAt,
        })
        .from(appAuthorizations)
        .innerJoin(oauthClient, eq(oauthClient.clientId, appAuthorizations.clientId))
        .where(and(eq(appAuthorizations.userId, userId), isNull(appAuthorizations.revokedAt)))
        .orderBy(desc(appAuthorizations.approvedAt))
    },

    async hasAuthorization(userId: string, clientId: string) {
      const [authorization] = await database
        .select({ id: appAuthorizations.id })
        .from(appAuthorizations)
        .where(and(eq(appAuthorizations.userId, userId), eq(appAuthorizations.clientId, clientId)))
        .limit(1)
      return Boolean(authorization)
    },
    async clientPolicy(clientId: string) {
      const client = await database.query.oauthClient.findFirst({
        where: eq(oauthClient.clientId, clientId),
        columns: { scopes: true, disabled: true },
      })
      const resources = await database
        .select({ identifier: oauthResource.identifier })
        .from(oauthClientResource)
        .innerJoin(oauthResource, eq(oauthResource.identifier, oauthClientResource.resourceId))
        .where(and(eq(oauthClientResource.clientId, clientId), eq(oauthResource.disabled, false)))
      return { client, resources: resources.map((resource) => resource.identifier) }
    },

    async issuedAccess(credential: string) {
      const [access] = await database
        .select({
          userId: oauthAccessToken.userId,
          clientId: oauthAccessToken.clientId,
          scopes: oauthAccessToken.scopes,
          resources: oauthAccessToken.resources,
        })
        .from(oauthAccessToken)
        .where(eq(oauthAccessToken.token, credentialDigest(credential)))
      return access ?? null
    },
    async issuedRefresh(credential: string) {
      const [refresh] = await database
        .select({
          userId: oauthRefreshToken.userId,
          clientId: oauthRefreshToken.clientId,
          expiresAt: oauthRefreshToken.expiresAt,
        })
        .from(oauthRefreshToken)
        .where(eq(oauthRefreshToken.token, credentialDigest(credential)))
      return refresh ?? null
    },
    async active(userId: string, clientId: string) {
      const [authorization] = await database
        .select()
        .from(appAuthorizations)
        .where(
          and(
            eq(appAuthorizations.userId, userId),
            eq(appAuthorizations.clientId, clientId),
            isNull(appAuthorizations.revokedAt),
          ),
        )
      return authorization ?? null
    },

    async approve(userId: string, clientId: string, scopes: string[], consentIssuedAt: Date) {
      return database.transaction(async (transaction) => {
        await lockUserClient(transaction, userId, clientId)
        const [latest] = await transaction
          .select()
          .from(appAuthorizations)
          .where(
            and(eq(appAuthorizations.userId, userId), eq(appAuthorizations.clientId, clientId)),
          )
          .orderBy(desc(appAuthorizations.approvedAt))
          .limit(1)
          .for('update')
        const [revoked] = await transaction
          .select()
          .from(appAuthorizations)
          .where(
            and(
              eq(appAuthorizations.userId, userId),
              eq(appAuthorizations.clientId, clientId),
              isNotNull(appAuthorizations.revokedAt),
            ),
          )
          .orderBy(desc(appAuthorizations.revokedAt))
          .limit(1)
        if (revoked?.revokedAt && consentIssuedAt <= revoked.revokedAt) {
          throw new Error('Consent predates authorization revocation')
        }
        let authorization
        if (latest && !latest.revokedAt) {
          const [updated] = await transaction
            .update(appAuthorizations)
            .set({
              scopes: [...new Set([...latest.scopes, ...scopes])],
            })
            .where(eq(appAuthorizations.id, latest.id))
            .returning()
          if (!updated) throw new Error('Authorization update failed')
          authorization = updated
        } else {
          const [created] = await transaction
            .insert(appAuthorizations)
            .values({
              userId,
              clientId,
              scopes: [...new Set(scopes)],
              approvedAt: sql`clock_timestamp()`,
            })
            .returning()
          if (!created) throw new Error('Authorization creation failed')
          authorization = created
        }
        await transaction
          .update(oauthConsent)
          .set({ scopes: authorization.scopes })
          .where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)))
        return authorization
      })
    },

    async bind(
      authorizationId: string,
      credentials: {
        kind: CredentialKind
        digest: string
        expiresAt: Date
      }[],
    ) {
      await database.transaction(async (transaction) => {
        const [authorization] = await transaction
          .select()
          .from(appAuthorizations)
          .where(
            and(eq(appAuthorizations.id, authorizationId), isNull(appAuthorizations.revokedAt)),
          )
          .for('share')
        if (!authorization) throw new Error('Authorization is not active')
        for (const credential of credentials) {
          const digest = credential.digest
          if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error('Invalid credential digest')
          await transaction
            .insert(authorizationBindings)
            .values({
              kind: credential.kind,
              digest,
              authorizationId,
              expiresAt: credential.expiresAt,
            })
            .onConflictDoNothing()
          const [binding] = await transaction
            .select()
            .from(authorizationBindings)
            .where(
              and(
                eq(authorizationBindings.kind, credential.kind),
                eq(authorizationBindings.digest, digest),
              ),
            )
          if (binding?.authorizationId !== authorizationId) {
            throw new Error('Credential cannot change authorization lifecycle')
          }
        }
      })
    },

    async resolve(kind: CredentialKind, credential: string) {
      const [match] = await database
        .select({ authorization: appAuthorizations, binding: authorizationBindings })
        .from(authorizationBindings)
        .innerJoin(
          appAuthorizations,
          eq(appAuthorizations.id, authorizationBindings.authorizationId),
        )
        .innerJoin(oauthClient, eq(oauthClient.clientId, appAuthorizations.clientId))
        .where(
          and(
            eq(authorizationBindings.kind, kind),
            eq(authorizationBindings.digest, credentialDigest(credential)),
            gt(authorizationBindings.expiresAt, sql`now()`),
            isNull(appAuthorizations.revokedAt),
            eq(oauthClient.disabled, false),
          ),
        )
      return match ?? null
    },

    async revoke(userId: string, clientId: string) {
      await database.transaction(async (transaction) => {
        await lockUserClient(transaction, userId, clientId)
        await transaction
          .update(appAuthorizations)
          .set({ revokedAt: sql`clock_timestamp()` })
          .where(
            and(
              eq(appAuthorizations.userId, userId),
              eq(appAuthorizations.clientId, clientId),
              isNull(appAuthorizations.revokedAt),
            ),
          )
        await transaction
          .delete(oauthConsent)
          .where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)))
      })
    },
  }
}

export type AuthorizationStore = ReturnType<typeof createAuthorizationStore>
