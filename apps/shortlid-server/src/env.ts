import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BASE_URL: z.url().transform((url) => url.replace(/\/$/, '')),
  DATABASE_URL: z.string().optional().default('postgresql://localhost:5432/shortlid'),
  REDIS_URL: z.string().optional().default('redis://localhost:6379'),
  HASH_CODE_SALT: z.string().min(8),
  AUTH_SERVER_URL: z.string().url(),
  CORS_ORIGINS: z.string().optional().transform((val) => {
    if (!val) return ['http://localhost:3000', 'http://localhost:5173']
    return val.split(',').map(s => s.trim())
  }),
})

export const env = envSchema.parse(process.env)
