import z from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  BASE_URL: z.url().transform((url) => url.replace(/\/$/, '')),
})

export const env = envSchema.parse(process.env)
