import { CreateShortenUrlUsecase } from '@/application/usecases/urls/create-shorten-url.usecase'
import { RedirectToUrlUsecase } from '@/application/usecases/urls/redirect-to-url.usecase'
import { env } from '@/env'
import { RedisClientAdapter } from '@infra/adapters/redis/redis.connection'
import { CreateShortenUrlController } from '@infra/controllers/urls/create-shorten-url/create-shorten-url.controller'
import { RedirectToUrlController } from '@infra/controllers/urls/redirect-to-url/redirect-to-url.controller'
import { HttpErrorHandler } from '@infra/middlewares/error.handler'
import { UrlRepository } from '@infra/repositories/url/url.repository.imp'
import { CounterService } from '@infra/services/counter.service'
import { ShortCodeService } from '@infra/services/short-code.service'
import { createServer } from '@leandrolid/framework'

async function main() {
  const app = await createServer({
    docs: true,
    zodValidation: true,
    multipartForm: {
      fileSize: 100 * 1024 * 1024,
      files: 100,
    },
    cors: ['*'],
    providers: [
      RedisClientAdapter,
      ShortCodeService,
      CounterService,
      UrlRepository,
      CreateShortenUrlUsecase,
      RedirectToUrlUsecase,
    ],
    controllers: [CreateShortenUrlController, RedirectToUrlController],
    errorHandler: new HttpErrorHandler(),
  })
  await app.start(env.PORT)
}

main()
