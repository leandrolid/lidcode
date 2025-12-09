import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BASE_URL: z.url().transform((url) => url.replace(/\/$/, '')),
  HEROKU_POSTGRESQL_ROSE_URL: z.string().optional().default('postgresql://localhost:5432/shortlid'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  SITE_URL: z.url(),
  HASH_CODE_SALT: z.string().min(8),
})

export const env = envSchema.parse(process.env)
