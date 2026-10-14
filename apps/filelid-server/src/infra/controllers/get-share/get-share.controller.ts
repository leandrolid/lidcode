import { GetShareUsecase } from '@app/usecases/shares/get-share.usecase'
import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

@ApiTags('Shares')
@Controller('v1/shares')
export class GetShareController {
  constructor(private readonly getShare: GetShareUsecase) {}

  @Get(':id')
  execute(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.getShare.execute(id)
  }
}
