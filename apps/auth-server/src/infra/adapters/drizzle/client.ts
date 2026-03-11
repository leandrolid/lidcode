import { env } from '@/env'
import { CustomDrizzleLogger } from '@infra/adapters/drizzle/logger'
import * as schema from '@infra/adapters/drizzle/schemas'
import { Inject, type Provider } from '@nestjs/common'
import 'dotenv/config'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

export type Schema = typeof schema
export type Drizzle = NodePgDatabase<Schema>

const pool = new Pool({
  connectionString: env.DATABASE_AUTH_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
})

const client = drizzle(pool, { schema, logger: new CustomDrizzleLogger() })

export const DrizzleAsyncProvider = 'DrizzleAsyncProvider'

export const DrizzleModuleProvider: Provider = {
  provide: DrizzleAsyncProvider,
  useFactory: async () => {
    // Lightweight connection check — fail fast if DB unreachable
    try {
      await pool.query('SELECT 1')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Database connection failed: ${message}`)
    }
    return client
  },
}

export const InjectDrizzle = () => Inject(DrizzleAsyncProvider)
