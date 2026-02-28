import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR, APP_PIPE, APP_FILTER } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod'
import { HttpExceptionFilter } from '@infra/adapters/nest/error-handler'
import { DrizzleModuleProvider } from '@infra/adapters/drizzle/client'
import { RedisClientAdapter } from '@infra/adapters/redis/redis.connection'
import { AuthModule } from '@infra/auth/auth.module'
import { HealthzController } from '@infra/controllers/healthz/healthz.controller'
import { GetMeController } from '@infra/controllers/me/get-me.controller'
import { ListUsersController } from '@infra/controllers/admin/list-users.controller'

const RedisAsyncProvider = {
  provide: 'RedisClientAdapter',
  useFactory: async (): Promise<RedisClientAdapter> => {
    const redis = new RedisClientAdapter()
    await redis.connect()
    return redis
  },
}
@Module({
  imports: [ScheduleModule.forRoot(), AuthModule],
  controllers: [HealthzController, GetMeController, ListUsersController],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    DrizzleModuleProvider,
    RedisAsyncProvider,
  ],
})
export class AppModule {}
