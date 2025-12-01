import type { IUrlRepository } from '@infra/repositories/url/url.repository'
import { Inject, Injectable, NotFoundError } from '@leandrolid/framework'

type Input = {
  shortCode: string
}

@Injectable()
export class RedirectToUrlUsecase {
  constructor(
    @Inject('IUrlRepository')
    private readonly urlRepository: IUrlRepository,
  ) {}

  async execute(input: Input) {
    const urlData = await this.urlRepository.findByShortCode(input.shortCode)
    if (!urlData) {
      throw new NotFoundError('URL not found')
    }
    return {
      originalUrl: urlData.originalUrl,
    }
  }
}
