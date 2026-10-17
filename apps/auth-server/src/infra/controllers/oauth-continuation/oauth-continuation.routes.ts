import { verifyOAuthQueryParams } from '@better-auth/oauth-provider'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { z } from 'zod'
import type { Auth } from '../../../auth.js'
import type { AuthEnv } from '../../../env.js'
import type { createDatabase } from '../../adapters/drizzle/client.js'
import { oauthClient } from '../../adapters/drizzle/schemas/auth.js'
import { requirePortalSession, type PortalEnv } from '../../adapters/hono/portal-session.js'
import type { AuthorizationStore } from '../../repositories/authorization-store.js'

export function oauthContinuationRoutes(auth: Auth, database: ReturnType<typeof createDatabase>['database'], store: AuthorizationStore, env: AuthEnv) {
  const routes = new Hono<PortalEnv>()
  routes.use('/', requirePortalSession(auth, env))
  routes.post('/', async (context) => {
    const input = z.object({ oauthQuery: z.string().min(1).max(16384) }).strict()
      .safeParse(await context.req.json().catch(() => null))
    const invalid = () => context.json({ error: 'invalid_request', message: 'This connection request is invalid or expired. Restart from your application.' }, 400)
    if (!input.success || !await verifyOAuthQueryParams(input.data.oauthQuery, env.AUTH_SECRET)) return invalid()
    const query = new URLSearchParams(input.data.oauthQuery)
    const clientId = query.get('client_id')
    if (!clientId || query.getAll('client_id').length !== 1 || query.getAll('redirect_uri').length !== 1) return invalid()
    const client = await database.query.oauthClient.findFirst({
      where: eq(oauthClient.clientId, clientId),
      columns: { clientId: true, name: true, disabled: true, scopes: true, redirectUris: true },
    })
    const scopes = (query.get('scope') ?? '').split(' ').filter(Boolean)
    const { resources } = await store.clientPolicy(clientId)
    if (!client || client.disabled || !client.redirectUris.includes(query.get('redirect_uri') ?? '') ||
      scopes.some((scope) => !client.scopes?.includes(scope)) ||
      query.getAll('resource').some((resource) => !resources.includes(resource))) return invalid()
    return context.json({ client: { id: client.clientId, name: client.name }, scopes })
  })
  return routes
}
