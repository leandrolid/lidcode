import { z } from 'zod'
import type { AuthorizationStore } from '../../infra/repositories/authorization-store.js'

const claimsSchema = z.object({
  sub: z.string(),
  client_id: z.string(),
  scope: z.string(),
  aud: z.union([z.string(), z.array(z.string())]).optional(),
})

// Call only after native cryptographic/token validation succeeds.
export async function validateAppAccess(
  store: AuthorizationStore,
  credential: string,
  nativeClaims: unknown,
  userInfoAudience: string,
) {
  const claims = claimsSchema.safeParse(nativeClaims)
  if (!claims.success) return false
  const match = await store.resolve('access', credential)
  if (
    !match ||
    claims.data.sub !== match.authorization.userId ||
    claims.data.client_id !== match.authorization.clientId
  )
    return false
  const { client, resources } = await store.clientPolicy(match.authorization.clientId)
  if (!client || client.disabled || resources.length === 0) return false
  const scopes = claims.data.scope.split(' ').filter(Boolean)
  const audiences = claims.data.aud
    ? Array.isArray(claims.data.aud)
      ? claims.data.aud
      : [claims.data.aud]
    : []
  return (
    scopes.every(
      (scope) => match.authorization.scopes.includes(scope) && client.scopes?.includes(scope),
    ) &&
    audiences.every(
      (audience) =>
        resources.includes(audience) ||
        (scopes.includes('openid') && audience === userInfoAudience),
    )
  )
}
