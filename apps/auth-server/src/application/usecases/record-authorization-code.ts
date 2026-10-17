import { getOAuthProviderState } from '@better-auth/oauth-provider'
import { APIError } from 'better-auth/api'
import { z } from 'zod'
import type { AuthorizationStore } from '../../infra/repositories/authorization-store.js'

const codeArtifactSchema = z.object({
  type: z.literal('authorization_code'),
  userId: z.string(),
  sessionId: z.string(),
  query: z.object({ client_id: z.string(), scope: z.string() }),
})

export async function recordAuthorizationCode(
  store: AuthorizationStore,
  artifact: { identifier: string; value: string; expiresAt: Date },
  explicitConsent: boolean,
  requestStartedAt: Date | undefined,
) {
  if (!artifact.value.startsWith('{')) return
  const parsed = codeArtifactSchema.safeParse(JSON.parse(artifact.value))
  if (!parsed.success) return
  // These identities and scopes come from the provider's validated code artifact.
  const code = parsed.data
  const state = await getOAuthProviderState()
  const issuedAt = state?.signedQueryIssuedAt ?? requestStartedAt
  if (!issuedAt) throw new APIError('FORBIDDEN', { error: 'consent_required' })
  const scopes = code.query.scope.split(' ')
  const authorization = explicitConsent
    ? await store.approve(code.userId, code.query.client_id, scopes, issuedAt)
    : await store.active(code.userId, code.query.client_id)

  if (
    !authorization ||
    (!explicitConsent && authorization.approvedAt > issuedAt) ||
    scopes.some((scope) => !authorization.scopes.includes(scope))
  ) {
    throw new APIError('FORBIDDEN', { error: 'consent_required' })
  }
  await store.bind(authorization.id, [
    { kind: 'code', digest: artifact.identifier, expiresAt: artifact.expiresAt },
  ])
}
