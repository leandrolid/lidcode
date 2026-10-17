import { createMiddleware } from 'hono/factory'
import type { Auth } from '../../../auth.js'
import type { AuthEnv } from '../../../env.js'

export type PortalEnv = { Variables: { user: Auth['$Infer']['Session']['user'] } }

export function requirePortalSession(auth: Auth, env: AuthEnv) {
  return createMiddleware<PortalEnv>(async (context, next) => {
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(context.req.method) &&
      (context.req.header('origin') !== env.AUTH_PUBLIC_ORIGIN ||
        context.req.header('sec-fetch-site') === 'cross-site')
    ) {
      return context.json({ error: 'invalid_origin' }, 403)
    }
    const session = await auth.api.getSession({ headers: context.req.raw.headers })
    if (!session?.user.emailVerified) return context.json({ error: 'unauthorized' }, 401)
    context.set('user', session.user)
    context.header('cache-control', 'no-store')
    await next()
  })
}
