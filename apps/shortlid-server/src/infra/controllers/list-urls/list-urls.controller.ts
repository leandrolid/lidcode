import type { AuthUser } from '@domain/services/auth.service'
import type { IUrlRepository } from '@infra/repositories/url/url.repository'
import { CurrentUser, RequireAuth } from '@infra/adapters/nest/auth.guard'
import { Controller, Get, Inject } from '@nestjs/common'

@Controller('v1/urls')
export class ListUrlsController {
  constructor(
    @Inject('IUrlRepository')
    private readonly urlRepository: IUrlRepository,
  ) {}

  @Get('/')
  @RequireAuth()
  async execute(@CurrentUser() user: AuthUser) {
    return this.urlRepository.findByUserId(user.id)
  }
}
