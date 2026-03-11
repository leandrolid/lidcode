import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3340),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_AUTH_URL: z.string().optional().default('postgresql://localhost:5432/authdb'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.url(),

  // Auth Cookies
  AUTH_COOKIE_DOMAIN: z.string().optional(),
  AUTH_COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  AUTH_COOKIE_SECURE: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),

  // CORS
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return []
      return val
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    }),

  // Resend (REQUIRED)
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  RESEND_FROM_EMAIL: z.email('RESEND_FROM_EMAIL must be a valid email'),

  // OAuth gating
  AUTH_ENABLE_GOOGLE: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  AUTH_ENABLE_GITHUB: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
})

export const env = envSchema.parse(process.env)
