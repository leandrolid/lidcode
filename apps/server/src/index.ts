import { CreateShortenUrlUsecase } from '@/application/usecases/urls/create-shorten-url.usecase'
import { env } from '@/env'
import { CreateShortenUrlController } from '@infra/controllers/urls/create-shorten-url/create-shorten-url.controller'
import { HttpErrorHandler } from '@infra/middlewares/error.handler'
import { UrlRepository } from '@infra/repositories/url/url.repository.imp'
import { CounterService } from '@infra/services/counter.service'
import { HashService } from '@infra/services/hash.service'
import { createServer } from '@lidcode/framework'

async function main() {
  const app = await createServer({
    docs: true,
    zodValidation: true,
    multipartForm: {
      fileSize: 100 * 1024 * 1024,
      files: 100,
    },
    cors: ['*'],
    providers: [HashService, CounterService, UrlRepository, CreateShortenUrlUsecase],
    controllers: [CreateShortenUrlController],
    errorHandler: new HttpErrorHandler(),
  })
  await app.start(env.PORT)
}

main()
