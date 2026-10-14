import { env } from '@/env'
import * as schema from '@infra/adapters/drizzle/schemas'
import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

@Injectable()
export class DatabaseClient implements OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: env.FILELID_DATABASE_URL,
    ssl: env.FILELID_DATABASE_SSL,
  })

  readonly database = drizzle(this.pool, { schema })

  async onModuleDestroy() {
    await this.pool.end()
  }
}

export type Drizzle = DatabaseClient['database']
export const DrizzleAsyncProvider = 'DrizzleAsyncProvider'
export const InjectDrizzle = () => Inject(DrizzleAsyncProvider)
export const DrizzleModuleProvider = {
  provide: DrizzleAsyncProvider,
  inject: [DatabaseClient],
  useFactory: (client: DatabaseClient) => client.database,
}
