import type { IUrlRepository } from '@infra/repositories/url/url.repository'
import { Inject, Injectable, NotFoundError } from '@lidcode/framework'

type Input = {
  code: string
}

@Injectable()
export class RedirectToUrlUsecase {
  constructor(
    @Inject('IUrlRepository')
    private readonly urlRepository: IUrlRepository,
  ) {}

  async execute(input: Input) {
    const urlData = await this.urlRepository.findByShortCode(input.code)
    if (!urlData) {
      throw new NotFoundError('URL not found')
    }
    return {
      originalUrl: urlData.originalUrl,
    }
  }
}
