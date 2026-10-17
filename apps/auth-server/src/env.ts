import { z } from 'zod'

const portSchema = z.coerce.number().int().min(1).max(65535)
const originSchema = z.url().refine((value) => {
  const url = new URL(value)
  return (
    ['http:', 'https:'].includes(url.protocol) &&
    !url.username &&
    !url.password &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash
  )
}, 'Must be an HTTP(S) origin without credentials, path, query, or fragment')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: portSchema.optional(),
  AUTH_PORT: portSchema.default(3334),
  AUTH_PUBLIC_ORIGIN: originSchema.optional(),
  AUTH_DATABASE_URL: z.url().refine((value) => {
    return ['postgres:', 'postgresql:'].includes(new URL(value).protocol)
  }, 'Must be a PostgreSQL connection URL'),
  AUTH_DATABASE_SSL: z.enum(['true', 'false']).optional(),
  AUTH_SECRET: z.string().min(32),
  AUTH_GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  AUTH_GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  AUTH_GITHUB_CLIENT_ID: z.string().min(1).optional(),
  AUTH_GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  AUTH_RESEND_API_KEY: z.string().min(1).optional(),
  AUTH_EMAIL_FROM: z.email().optional(),
})

export function parseEnv(input: NodeJS.ProcessEnv) {
  const env = envSchema
    .superRefine((values, context) => {
      if (values.NODE_ENV === 'production') {
        for (const key of [
          'AUTH_PUBLIC_ORIGIN',
          'AUTH_DATABASE_SSL',
          'AUTH_GOOGLE_CLIENT_ID',
          'AUTH_GOOGLE_CLIENT_SECRET',
          'AUTH_GITHUB_CLIENT_ID',
          'AUTH_GITHUB_CLIENT_SECRET',
          'AUTH_RESEND_API_KEY',
          'AUTH_EMAIL_FROM',
        ] as const) {
          if (!values[key]) {
            context.addIssue({ code: 'custom', path: [key], message: 'Required in production' })
          }
        }

        if (values.AUTH_PUBLIC_ORIGIN && !values.AUTH_PUBLIC_ORIGIN.startsWith('https://')) {
          context.addIssue({
            code: 'custom',
            path: ['AUTH_PUBLIC_ORIGIN'],
            message: 'Production requires HTTPS',
          })
        }
      }

      for (const [id, secret] of [
        ['AUTH_GOOGLE_CLIENT_ID', 'AUTH_GOOGLE_CLIENT_SECRET'],
        ['AUTH_GITHUB_CLIENT_ID', 'AUTH_GITHUB_CLIENT_SECRET'],
        ['AUTH_RESEND_API_KEY', 'AUTH_EMAIL_FROM'],
      ] as const) {
        if (Boolean(values[id]) !== Boolean(values[secret])) {
          context.addIssue({
            code: 'custom',
            path: [id],
            message: `Configure both ${id} and ${secret}`,
          })
        }
      }
    })
    .parse(input)

  const publicOrigin = new URL(env.AUTH_PUBLIC_ORIGIN ?? 'http://localhost:3001').origin

  return {
    ...env,
    AUTH_PORT: env.PORT ?? env.AUTH_PORT,
    AUTH_PUBLIC_ORIGIN: publicOrigin,
    AUTH_DATABASE_SSL: env.AUTH_DATABASE_SSL === 'true',
    issuer: `${publicOrigin}/api/auth`,
  }
}

export type AuthEnv = ReturnType<typeof parseEnv>
