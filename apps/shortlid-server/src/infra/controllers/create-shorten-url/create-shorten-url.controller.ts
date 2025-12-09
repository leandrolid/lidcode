import { CreateShortenUrlUsecase } from '@/application/usecases/urls/create-shorten-url.usecase'
import { CreateShortenUrlBody } from '@infra/controllers/create-shorten-url/create-shorten-url.validation'
import { Body, Controller, Post } from '@nestjs/common'
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

@Controller('v1/urls')
@ApiTags('Shorten URLs')
export class CreateShortenUrlController {
  constructor(private readonly createShortenUrlUsecase: CreateShortenUrlUsecase) {}

  @Post('/')
  @ApiOperation({
    operationId: 'createShortenUrl',
    summary: 'Create Shorten URL',
    description: 'Controller to create shortened URLs',
  })
  @ApiResponse({
    status: 201,
    description: 'The shortened URL has been successfully created.',
  })
  @ApiBody({ type: CreateShortenUrlBody.Output })
  async execute(@Body() body: CreateShortenUrlBody) {
    return this.createShortenUrlUsecase.execute({
      ...body,
    })
  }
}
