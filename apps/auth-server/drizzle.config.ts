import { defineConfig } from 'drizzle-kit'
import { z } from 'zod'

const env = z
  .object({
    AUTH_DATABASE_URL: z.url(),
    AUTH_DATABASE_SSL: z.enum(['true', 'false']).default('false'),
  })
  .parse(process.env)

export default defineConfig({
  schema: './src/infra/adapters/drizzle/schemas/index.ts',
  out: './src/infra/adapters/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.AUTH_DATABASE_URL,
    ssl: env.AUTH_DATABASE_SSL === 'true',
  },
})
