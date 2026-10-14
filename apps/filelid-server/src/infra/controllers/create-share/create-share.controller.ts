import { CreateShareUsecase } from '@app/usecases/shares/create-share.usecase'
import type { UploadFile } from '@domain/sharing'
import { CreateShareQuery } from '@infra/controllers/create-share/create-share.validation'
import {
  BadRequestException,
  Controller,
  PayloadTooLargeException,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import type { FastifyRequest } from 'fastify'

@ApiTags('Shares')
@Controller('v1/shares')
export class CreateShareController {
  constructor(private readonly createShare: CreateShareUsecase) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } },
      required: ['files'],
    },
  })
  async execute(@Query() query: CreateShareQuery, @Req() request: FastifyRequest) {
    if (!request.isMultipart()) throw new BadRequestException('Expected a multipart file upload')
    async function* files(): AsyncGenerator<UploadFile> {
      for await (const part of request.parts()) {
        if (part.type !== 'file' || part.fieldname !== 'files') {
          if (part.type === 'file') part.file.resume()
          throw new BadRequestException('Only files fields are accepted')
        }
        yield { name: part.filename, contentType: part.mimetype, content: part.file }
        if (part.file.truncated)
          throw new PayloadTooLargeException('A share can contain at most 100 MB')
      }
    }
    return this.createShare.execute({ expiresIn: query.expiresIn, files: files() })
  }
}
