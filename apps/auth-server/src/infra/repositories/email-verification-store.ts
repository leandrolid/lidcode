import { randomUUID } from 'node:crypto'
import { and, eq, gt, sql } from 'drizzle-orm'
import { decodeJwt } from 'jose'
import type { createDatabase } from '../adapters/drizzle/client.js'
import { verification } from '../adapters/drizzle/schemas/auth.js'
import { credentialDigest } from './authorization-store.js'

export function createEmailVerificationStore(
  database: ReturnType<typeof createDatabase>['database'],
) {
  return {
    async record(token: string) {
      const claims = decodeJwt(token)
      if (typeof claims.exp !== 'number') throw new Error('Verification proof must expire')
      const expiresAt = new Date(claims.exp * 1000)
      const identifier = `email-proof:${credentialDigest(token)}`
      await database.transaction(async (transaction) => {
        await transaction.execute(
          sql`SELECT pg_advisory_xact_lock(hashtextextended(${identifier}, 0))`,
        )
        const [existing] = await transaction
          .select({ id: verification.id })
          .from(verification)
          .where(eq(verification.identifier, identifier))
          .limit(1)
        // Identical same-second resend tokens must never reset an already consumed proof.
        if (!existing)
          await transaction.insert(verification).values({
            id: randomUUID(),
            identifier,
            value: 'pending',
            expiresAt,
          })
      })
    },
    async consume(token: string) {
      const consumed = await database
        .update(verification)
        .set({ value: 'consumed' })
        .where(
          and(
            eq(verification.identifier, `email-proof:${credentialDigest(token)}`),
            eq(verification.value, 'pending'),
            gt(verification.expiresAt, sql`now()`),
          ),
        )
        .returning({ id: verification.id })
      return consumed.length === 1
    },
  }
}
