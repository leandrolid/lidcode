import { CreateShortenUrlUsecase } from '@/application/usecases/urls/create-shorten-url.usecase'
import {
  CreateShortenUrlResponseValidation,
  CreateShortenUrlValidation,
} from '@infra/controllers/create-shorten-url/create-shorten-url.validation'
import { Body, Controller, Docs, Post, Validate, type InferBody } from '@lidcode/framework'

@Controller('v1/urls')
@Docs({
  tags: ['Shorten URLs'],
  title: 'Create Shorten URL',
  description: 'Controller to create shortened URLs',
  response: new CreateShortenUrlResponseValidation(),
})
export class CreateShortenUrlController {
  constructor(private readonly createShortenUrlUsecase: CreateShortenUrlUsecase) {}

  @Post('')
  @Validate(new CreateShortenUrlValidation())
  async execute(@Body() body: InferBody<CreateShortenUrlValidation>) {
    return this.createShortenUrlUsecase.execute({
      ...body,
    })
  }
}
