import { Module, Global } from '@nestjs/common'
import { AuthModule as BetterAuthNestModule } from '@thallesp/nestjs-better-auth'
import { InjectDrizzle } from '@infra/adapters/drizzle/client'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { createAuthInstance } from '@infra/auth/auth'
import { RedisStorageService } from '@infra/services/redis-storage.service'

@Global()
@Module({
  imports: [
    BetterAuthNestModule.forRootAsync({
      useFactory: (
        db: NodePgDatabase<Record<string, never>>,
        redisStorage: RedisStorageService,
      ) => ({
        auth: createAuthInstance(db, redisStorage),
        prefix: '/v1/auth',
      }),
      inject: [InjectDrizzle, RedisStorageService],
    }),
  ],
  providers: [RedisStorageService],
  exports: [BetterAuthNestModule, RedisStorageService],
})
export class AuthModule {}
