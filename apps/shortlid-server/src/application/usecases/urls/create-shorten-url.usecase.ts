import { env } from '@/env'
import type { ICounterService } from '@domain/services/counter.service'
import type { IShortCodeService } from '@domain/services/short-code.service'
import type { IUrlRepository } from '@infra/repositories/url/url.repository'
import { Inject, Injectable } from '@nestjs/common'

type Input = {
  originalUrl: string
  userId?: string
}

@Injectable()
export class CreateShortenUrlUsecase {
  constructor(
    @Inject('IShortCodeService')
    private readonly shortCodeService: IShortCodeService,
    @Inject('ICounterService')
    private readonly counterService: ICounterService,
    @Inject('IUrlRepository')
    private readonly urlRepository: IUrlRepository,
  ) {}

  async execute(input: Input) {
    const id = await this.counterService.getCountFor('url_counter')
    const shortCode = this.shortCodeService.createFromId(id)
    const created = await this.urlRepository.create({
      id,
      originalUrl: input.originalUrl,
      shortCode,
      userId: input.userId,
    })
    return {
      id: created.id,
      shortUrl: `${env.BASE_URL}/${shortCode}`,
      originalUrl: input.originalUrl,
    }
  }
}
