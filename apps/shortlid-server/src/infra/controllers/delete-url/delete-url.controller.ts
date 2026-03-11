import type { AuthUser } from '@domain/services/auth.service'
import type { IUrlRepository } from '@infra/repositories/url/url.repository'
import { CurrentUser, RequireAuth } from '@infra/adapters/nest/auth.guard'
import { Controller, Delete, HttpCode, Inject, NotFoundException, Param } from '@nestjs/common'

@Controller('v1/urls')
export class DeleteUrlController {
  constructor(
    @Inject('IUrlRepository')
    private readonly urlRepository: IUrlRepository,
  ) {}

  @Delete('/:id')
  @HttpCode(204)
  @RequireAuth()
  async execute(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    const numericId = parseInt(id, 10)
    const deleted = await this.urlRepository.deleteByIdAndUserId(numericId, user.id)
    if (!deleted) {
      throw new NotFoundException(`URL with id ${id} not found`)
    }
  }
}
