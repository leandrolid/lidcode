import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { z } from 'zod'
import { createDatabase } from '../infra/adapters/drizzle/client.js'

try {
  const env = z.object({
    AUTH_DATABASE_URL: z.url().regex(/^postgres(?:ql)?:/),
    AUTH_DATABASE_SSL: z.enum(['true', 'false']).default('false'),
  }).parse(process.env)
  const client = createDatabase({ AUTH_DATABASE_URL: env.AUTH_DATABASE_URL, AUTH_DATABASE_SSL: env.AUTH_DATABASE_SSL === 'true' })
  try {
    await migrate(client.database, { migrationsFolder: fileURLToPath(new URL('../infra/adapters/drizzle/migrations/', import.meta.url)) })
    console.log('Auth migrations applied')
  } finally { await client.close() }
} catch {
  console.error('Auth migration failed: verify the database settings and built migration files')
  process.exitCode = 1
}
