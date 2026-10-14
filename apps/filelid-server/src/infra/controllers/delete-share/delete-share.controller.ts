import { DeleteShareUsecase } from '@app/usecases/shares/delete-share.usecase'
import {
  Controller,
  Delete,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'

@ApiTags('Shares')
@Controller('v1/shares')
export class DeleteShareController {
  constructor(private readonly deleteShare: DeleteShareUsecase) {}

  @Delete(':id')
  @HttpCode(204)
  @ApiBearerAuth()
  async execute(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const match = authorization?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)
    if (!match?.[1]) throw new UnauthorizedException('A management token is required')
    await this.deleteShare.execute({ id, managementToken: match[1] })
  }
}
