import { DownloadFileUsecase } from '@app/usecases/shares/download-file.usecase'
import { Controller, Get, Param, ParseUUIDPipe, Res } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { FastifyReply } from 'fastify'

@ApiTags('Shares')
@Controller('v1/shares')
export class DownloadFileController {
  constructor(private readonly downloadFile: DownloadFileUsecase) {}

  @Get(':id/files/:fileId')
  async execute(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('fileId', new ParseUUIDPipe({ version: '4' })) fileId: string,
    @Res() response: FastifyReply,
  ) {
    const { file, stream } = await this.downloadFile.execute({ shareId: id, fileId })
    const filename = encodeURIComponent(file.name).replace(
      /['()*]/g,
      (char) => `%${char.charCodeAt(0).toString(16)}`,
    )
    return response
      .header('content-type', 'application/octet-stream')
      .header('content-length', file.size)
      .header(
        'content-disposition',
        `attachment; filename="download"; filename*=UTF-8''${filename}`,
      )
      .header('x-content-type-options', 'nosniff')
      .send(stream)
  }
}
