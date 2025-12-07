import { CreateShortenUrlUsecase } from '@/application/usecases/urls/create-shorten-url.usecase'
import { RedirectToUrlUsecase } from '@/application/usecases/urls/redirect-to-url.usecase'
import { PrismaDatabaseConnection } from '@infra/adapters/prisma/connection.imp'
import { PrismaRepository } from '@infra/adapters/prisma/repository.imp'
import { RedisClientAdapter } from '@infra/adapters/redis/redis.connection'
import { CreateShortenUrlController } from '@infra/controllers/create-shorten-url/create-shorten-url.controller'
import { GetHomeController } from '@infra/controllers/get-home/get-home.controller'
import { RedirectToUrlController } from '@infra/controllers/redirect-to-url/redirect-to-url.controller'
import { ExpireLinksCron } from '@infra/crons/expire-links.cron'
import { UrlRepository } from '@infra/repositories/url/url.repository.imp'
import { CounterService } from '@infra/services/counter.service'
import { ShortCodeService } from '@infra/services/short-code.service'
import { Module } from '@nestjs/common'
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { ScheduleModule } from '@nestjs/schedule'
import { ZodSerializerInterceptor, ZodValidationPipe } from 'nestjs-zod'

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [GetHomeController, CreateShortenUrlController, RedirectToUrlController],
  providers: [
    CreateShortenUrlUsecase,
    RedirectToUrlUsecase,
    RedisClientAdapter,
    ExpireLinksCron,
    {
      provide: 'IShortCodeService',
      useClass: ShortCodeService,
    },
    {
      provide: 'ICounterService',
      useClass: CounterService,
    },
    {
      provide: 'IUrlRepository',
      useClass: UrlRepository,
    },
    {
      provide: 'ShortenedUrl',
      useFactory: () => {
        const connection = PrismaDatabaseConnection.getInstance()
        return new PrismaRepository(connection, 'ShortenedUrl')
      },
    },
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],
})
export class RootModule {}
