import { CreateShortenUrlUsecase } from '@/application/usecases/urls/create-shorten-url.usecase'
import { type CreateShortenUrlBody } from '@infra/controllers/create-shorten-url/create-shorten-url.validation'
import { Body, Controller, Post, UsePipes } from '@nestjs/common'
import { ZodValidationPipe } from 'nestjs-zod'

@Controller('v1/urls')
// @Docs({
//   tags: ['Shorten URLs'],
//   title: 'Create Shorten URL',
//   description: 'Controller to create shortened URLs',
//   response: new CreateShortenUrlResponseValidation(),
// })
export class CreateShortenUrlController {
  constructor(private readonly createShortenUrlUsecase: CreateShortenUrlUsecase) {}

  @Post('/')
  @UsePipes(ZodValidationPipe)
  async execute(@Body() body: CreateShortenUrlBody) {
    return this.createShortenUrlUsecase.execute({
      ...body,
    })
  }
}
