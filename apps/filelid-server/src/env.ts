import 'dotenv/config'
import z from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FILELID_PORT: z.coerce.number().int().min(1).max(65535).default(3335),
  FILELID_DATABASE_URL: z.url().default('postgresql://localhost:5432/filelid'),
  FILELID_DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  FILELID_WEB_URL: z
    .url()
    .default('http://localhost:3002')
    .transform((v) => v.replace(/\/$/, '')),
  FILELID_CORS_ORIGINS: z
    .string()
    .default('http://localhost:3002')
    .transform((v) => v.split(',').map((origin) => z.url().parse(origin.trim()))),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
})

export const env = envSchema.parse(process.env)
