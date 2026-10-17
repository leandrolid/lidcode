import { Hono } from 'hono'
import type { HttpBindings } from '@hono/node-server'
import type { Auth } from './auth.js'
import type { AuthEnv } from './env.js'
import type { createDatabase } from './infra/adapters/drizzle/client.js'
import { authorizedAppRoutes } from './infra/controllers/authorized-apps/authorized-apps.routes.js'
import { signInMethodRoutes } from './infra/controllers/sign-in-methods/sign-in-methods.routes.js'
import { profileRoutes } from './infra/controllers/profile/profile.routes.js'
import { oauthClientRoutes } from './infra/controllers/oauth-clients/oauth-clients.routes.js'
import { oauthContinuationRoutes } from './infra/controllers/oauth-continuation/oauth-continuation.routes.js'
import { createAuthorizationStore } from './infra/repositories/authorization-store.js'

export function createApp(
  auth: Auth,
  database: ReturnType<typeof createDatabase>['database'],
  env: AuthEnv,
) {
  const app = new Hono<{ Bindings: HttpBindings }>()
  const authorizations = createAuthorizationStore(database)

  app.onError((_error, context) => context.json({ error: 'temporarily_unavailable' }, 503))
  app.get('/healthz', (context) => context.json({ status: 'ok' }))
  app.use('/api/auth/*', async (context, next) => {
    context.req.raw.headers.delete('x-lidcode-peer-ip')
    const peer = context.env.incoming?.socket.remoteAddress
    if (peer) context.req.raw.headers.set('x-lidcode-peer-ip', peer)
    await next()
  })
  app.all('/api/auth/*', (context) => auth.handler(context.req.raw))
  app.all('/.well-known/*', (context) => auth.handler(context.req.raw))
  app.route('/api/v1/authorized-apps', authorizedAppRoutes(auth, authorizations, env))
  app.route('/api/v1/me/sign-in-methods', signInMethodRoutes(auth, database, env))
  app.route('/api/v1/me', profileRoutes(auth, env))
  app.route('/api/v1/admin/oauth-clients', oauthClientRoutes(auth, database, env))
  app.route('/api/v1/oauth/continuation', oauthContinuationRoutes(auth, database, authorizations, env))

  return app
}
