import type { IShortCodeService } from '@domain/services/short-code.service'
import type { IUrlRepository } from '@infra/repositories/url/url.repository'
import { Inject, Injectable, NotFoundException } from '@nestjs/common'

type Input = {
  code: string
}

@Injectable()
export class RedirectToUrlUsecase {
  constructor(
    @Inject('IUrlRepository')
    private readonly urlRepository: IUrlRepository,
    @Inject('IShortCodeService')
    private readonly shortCodeService: IShortCodeService,
  ) {}

  async execute(input: Input) {
    const id = this.shortCodeService.getIdFromCode(input.code)
    const urlData = await this.urlRepository.findById(id as number)
    if (!urlData) {
      throw new NotFoundException('URL not found')
    }
    return {
      originalUrl: urlData.originalUrl,
    }
  }
}
