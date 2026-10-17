import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import * as schema from '../infra/adapters/drizzle/schemas/index.js'

export function connectTestDatabase(url: string) {
  if (!/^\/lidcode_auth_test_[a-f0-9]+$/.test(new URL(url).pathname)) {
    throw new Error('Shared instances must target an isolated auth test database')
  }
  const pool = new Pool({ connectionString: url })
  const database = drizzle(pool, { schema })
  return {
    pool,
    database,
    url,
    migrate: () =>
      migrate(database, {
        migrationsFolder: fileURLToPath(
          new URL('../infra/adapters/drizzle/migrations/', import.meta.url),
        ),
      }),
    close: () => pool.end(),
  }
}

export async function createTestDatabase() {
  const connectionString = process.env.AUTH_TEST_DATABASE_URL
  if (!connectionString) {
    throw new Error('AUTH_TEST_DATABASE_URL is required and must permit isolated test databases')
  }

  const admin = new Pool({ connectionString })
  const name = `lidcode_auth_test_${randomUUID().replaceAll('-', '')}`
  const url = new URL(connectionString)
  url.pathname = `/${name}`
  let connected: ReturnType<typeof connectTestDatabase> | undefined

  try {
    await admin.query(`CREATE DATABASE "${name}"`)
    connected = connectTestDatabase(url.href)

    return {
      ...connected,
      async close() {
        try {
          await connected?.close()
          await admin.query(`DROP DATABASE "${name}"`)
        } finally {
          await admin.end()
        }
      },
    }
  } catch (error) {
    await connected?.close()
    await admin.query(`DROP DATABASE IF EXISTS "${name}"`)
    await admin.end()
    throw error
  }
}
