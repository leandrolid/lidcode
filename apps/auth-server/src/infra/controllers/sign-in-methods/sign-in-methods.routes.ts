import { APIError } from 'better-auth/api'
import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Auth } from '../../../auth.js'
import type { AuthEnv } from '../../../env.js'
import type { createDatabase } from '../../adapters/drizzle/client.js'
import { account, user } from '../../adapters/drizzle/schemas/auth.js'
import { requirePortalSession, type PortalEnv } from '../../adapters/hono/portal-session.js'

export function signInMethodRoutes(
  auth: Auth,
  database: ReturnType<typeof createDatabase>['database'],
  env: AuthEnv,
) {
  const routes = new Hono<PortalEnv>()
  routes.use('*', requirePortalSession(auth, env))

  routes.get('/', async (context) => {
    const accounts = await database
      .select({ id: account.id, providerId: account.providerId, password: account.password })
      .from(account)
      .where(eq(account.userId, context.get('user').id))
    return context.json({
      methods: accounts.map((method) => ({
        id: method.id,
        provider: method.providerId,
        usable: method.providerId !== 'credential' || Boolean(method.password),
      })),
    })
  })

  routes.delete('/:accountId', async (context) => {
    if (Object.keys(context.req.query()).length || (await context.req.text()).trim()) {
      return context.json({ error: 'invalid_request' }, 400)
    }
    const userId = context.get('user').id
    try {
      return await database.transaction(async (transaction) => {
        // Serialize removal and provider linking for this identity, including simultaneous removals.
        await transaction
          .select({ id: user.id })
          .from(user)
          .where(eq(user.id, userId))
          .for('update')
        const accounts = await transaction.select().from(account).where(eq(account.userId, userId))
        const target = accounts.find((method) => method.id === context.req.param('accountId'))
        if (!target) return context.json({ error: 'not_found' }, 404)
        if (
          !accounts.some(
            (method) =>
              method.id !== target.id &&
              (method.providerId !== 'credential' || Boolean(method.password)),
          )
        ) {
          return context.json(
            { error: 'last_sign_in_method', message: 'Add another sign-in method first' },
            400,
          )
        }
        await auth.api.unlinkAccount({
          headers: context.req.raw.headers,
          body: { accountId: target.id },
        })
        return context.json({ success: true })
      })
    } catch (error) {
      if (error instanceof APIError)
        return context.json({ error: 'unlink_failed', message: error.message }, 400)
      throw error
    }
  })

  return routes
}
