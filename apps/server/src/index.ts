import { CreateShortenUrlUsecase } from '@/application/usecases/urls/create-shorten-url.usecase'
import { RedirectToUrlUsecase } from '@/application/usecases/urls/redirect-to-url.usecase'
import { env } from '@/env'
import { RedisClientAdapter } from '@infra/adapters/redis/redis.connection'
import { CreateShortenUrlController } from '@infra/controllers/create-shorten-url/create-shorten-url.controller'
import { GetHomeController } from '@infra/controllers/get-home/get-home.controller'
import { RedirectToUrlController } from '@infra/controllers/redirect-to-url/redirect-to-url.controller'
import { ExpireLinksCron } from '@infra/crons/expire-links.cron'
import { HttpErrorHandler } from '@infra/middlewares/error.handler'
import { UrlRepository } from '@infra/repositories/url/url.repository.imp'
import { CounterService } from '@infra/services/counter.service'
import { ShortCodeService } from '@infra/services/short-code.service'
import { CronModule } from '@lidcode/cron'
import { createServer } from '@lidcode/framework'

async function main() {
  const app = await createServer({
    docs: env.NODE_ENV !== 'production',
    zodValidation: true,
    cors: ['*'],
    multipartForm: {
      files: 1,
      fileSize: 5 * 1024 * 1024,
    },
    providers: [
      RedisClientAdapter,
      ShortCodeService,
      CounterService,
      UrlRepository,
      CreateShortenUrlUsecase,
      RedirectToUrlUsecase,
    ],
    controllers: [GetHomeController, CreateShortenUrlController, RedirectToUrlController],
    errorHandler: new HttpErrorHandler(),
    modules: [
      CronModule.config({
        options: {
          crons: [ExpireLinksCron],
        },
      }),
    ],
  })
  await app.start(env.PORT)
}

main()
