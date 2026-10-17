import { Hono } from 'hono'
import { z } from 'zod'
import type { Auth } from '../../../auth.js'
import type { AuthEnv } from '../../../env.js'
import { requirePortalSession, type PortalEnv } from '../../adapters/hono/portal-session.js'

const profileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    image: z
      .url()
      .refine((value) => /^https?:\/\//i.test(value), 'Use an HTTP(S) image URL')
      .nullable()
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, 'Provide a name or avatar')

export function profileRoutes(auth: Auth, env: AuthEnv) {
  const routes = new Hono<PortalEnv>()
  routes.use('/', requirePortalSession(auth, env))

  routes.get('/', (context) => {
    const { id, name, email, emailVerified, image, role } = context.get('user')
    return context.json({ user: { id, name, email, emailVerified, image, role } })
  })

  routes.patch('/', async (context) => {
    const input = profileSchema.safeParse(await context.req.json().catch(() => null))
    if (!input.success)
      return context.json({ error: 'validation_error', issues: input.error.issues }, 400)
    await auth.api.updateUser({ headers: context.req.raw.headers, body: input.data })
    const session = await auth.api.getSession({ headers: context.req.raw.headers })
    if (!session) return context.json({ error: 'unauthorized' }, 401)
    const { id, name, email, emailVerified, image, role } = session.user
    return context.json({ user: { id, name, email, emailVerified, image, role } })
  })

  return routes
}
