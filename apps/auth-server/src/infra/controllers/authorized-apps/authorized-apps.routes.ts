import { Hono } from 'hono'
import { z } from 'zod'
import type { Auth } from '../../../auth.js'
import type { AuthEnv } from '../../../env.js'
import { requirePortalSession, type PortalEnv } from '../../adapters/hono/portal-session.js'
import type { AuthorizationStore } from '../../repositories/authorization-store.js'

export function authorizedAppRoutes(auth: Auth, store: AuthorizationStore, env: AuthEnv) {
  const routes = new Hono<PortalEnv>()
  routes.use('*', requirePortalSession(auth, env))

  routes.get('/', async (context) => {
    return context.json({ apps: await store.list(context.get('user').id) })
  })

  routes.delete('/:clientId', async (context) => {
    const client = z
      .string()
      .regex(/^[A-Za-z0-9_-]{1,128}$/)
      .safeParse(context.req.param('clientId'))
    if (
      !client.success ||
      Object.keys(context.req.query()).length > 0 ||
      (await context.req.text()).trim()
    ) {
      return context.json({ error: 'invalid_request' }, 400)
    }
    const userId = context.get('user').id
    if (!(await store.hasAuthorization(userId, client.data)))
      return context.json({ error: 'not_found' }, 404)
    await store.revoke(userId, client.data)
    return context.json({ success: true })
  })

  return routes
}
