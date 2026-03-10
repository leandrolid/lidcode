import { Module, Global } from '@nestjs/common'
import { AuthModule as BetterAuthNestModule } from '@thallesp/nestjs-better-auth'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { createAuthInstance } from '@infra/auth/auth'
import { RedisStorageService } from '@infra/services/redis-storage.service'
import { DrizzleModule } from '@infra/adapters/drizzle/drizzle.module'
import { RedisModule } from '@infra/adapters/redis/redis.module'

@Global()
@Module({
  imports: [
    DrizzleModule,
    RedisModule,
    BetterAuthNestModule.forRootAsync({
      imports: [DrizzleModule, RedisModule],
      useFactory: (
        db: NodePgDatabase<Record<string, never>>,
        redisStorage: RedisStorageService,
      ) => ({
        auth: createAuthInstance(db, redisStorage),
        prefix: '/v1/auth',
        disableBodyParser: true,
        disableTrustedOriginsCors: true,
      }),
      inject: ['DrizzleAsyncProvider', RedisStorageService],
    }),
  ],
  providers: [RedisStorageService],
  exports: [BetterAuthNestModule, RedisStorageService],
})
export class AuthModule {}
