import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import type { AuthEnv } from '../../../env.js'
import * as schema from './schemas/index.js'

export function createDatabase(env: Pick<AuthEnv, 'AUTH_DATABASE_URL' | 'AUTH_DATABASE_SSL'>) {
  const pool = new Pool({
    connectionString: env.AUTH_DATABASE_URL,
    ssl: env.AUTH_DATABASE_SSL,
  })

  return {
    database: drizzle(pool, { schema }),
    close: () => pool.end(),
  }
}
