import { CreateShortenUrlUsecase } from '@/application/usecases/urls/create-shorten-url.usecase'
import { RedirectToUrlUsecase } from '@/application/usecases/urls/redirect-to-url.usecase'
import { DrizzleModuleProvider } from '@infra/adapters/drizzle/client'
import { AuthGuard } from '@infra/adapters/nest/auth.guard'
import { HttpExceptionFilter } from '@infra/adapters/nest/error-handler'
import { RedisClientAdapter } from '@infra/adapters/redis/redis.connection'
import { CreateShortenUrlController } from '@infra/controllers/create-shorten-url/create-shorten-url.controller'
import { GetHomeController } from '@infra/controllers/get-home/get-home.controller'
import { RedirectToUrlController } from '@infra/controllers/redirect-to-url/redirect-to-url.controller'
import { ListUrlsController } from '@infra/controllers/list-urls/list-urls.controller'
import { DeleteUrlController } from '@infra/controllers/delete-url/delete-url.controller'
import { ExpireLinksCron } from '@infra/crons/expire-links.cron'
import { UrlRepository } from '@infra/repositories/url/url.repository.imp'
import { CounterService } from '@infra/services/counter.service'
import { AuthService } from '@infra/services/auth.service.imp'
import { ShortCodeService } from '@infra/services/short-code.service'
import { Module } from '@nestjs/common'
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod'

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [GetHomeController, CreateShortenUrlController, RedirectToUrlController, ListUrlsController, DeleteUrlController],
  providers: [
    CreateShortenUrlUsecase,
    RedirectToUrlUsecase,
    RedisClientAdapter,
    ExpireLinksCron,
    DrizzleModuleProvider,
    {
      provide: 'IShortCodeService',
      useClass: ShortCodeService,
    },
    {
      provide: 'ICounterService',
      useClass: CounterService,
    },
    {
      provide: 'IAuthService',
      useClass: AuthService,
    },
    {
      provide: 'IUrlRepository',
      useClass: UrlRepository,
    },
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
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
