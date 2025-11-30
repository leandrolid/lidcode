import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  BASE_URL: z.url().transform((url) => url.replace(/\/$/, '')),
  DATABASE_URL: z.string(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
})

export const env = envSchema.parse(process.env)
