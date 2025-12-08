import { env } from '@/env'
import { CustomDrizzleLogger } from '@infra/adapters/drizzle/logger'
import * as schema from '@infra/adapters/drizzle/schemas'
import { Inject, type Provider } from '@nestjs/common'
import 'dotenv/config'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'

export type Schema = typeof schema
export type Drizzle = NodePgDatabase<Schema>

const client = drizzle(env.HEROKU_POSTGRESQL_ROSE_URL, {
  schema,
  logger: new CustomDrizzleLogger(),
}) as Drizzle

export const DrizzleAsyncProvider = 'DrizzleAsyncProvider'

export const DrizzleModuleProvider: Provider = {
  provide: DrizzleAsyncProvider,
  useFactory: () => client,
}

export const InjectDrizzle = () => Inject(DrizzleAsyncProvider)
