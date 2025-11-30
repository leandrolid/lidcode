import { env } from '@/env'
import type { ICounterService } from '@domain/services/counter.service'
import type { IHashService } from '@domain/services/hash.service'
import type { IUrlRepository } from '@infra/repositories/url/url.repository'
import { Inject, Injectable } from '@lidcode/framework'

type Input = {
  originalUrl: string
}

@Injectable()
export class CreateShortenUrlUsecase {
  constructor(
    @Inject('IHashService')
    private readonly hashService: IHashService,
    @Inject('ICounterService')
    private readonly counterService: ICounterService,
    @Inject('IUrlRepository')
    private readonly urlRepository: IUrlRepository,
  ) {}

  async execute(input: Input): Promise<{ shortUrl: string }> {
    const id = await this.counterService.getCountFor('url_counter')
    const shortCode = this.hashService.createHashFromId(id)
    await this.urlRepository.create({
      id,
      originalUrl: input.originalUrl,
      shortCode,
    })
    return {
      shortUrl: `${env.BASE_URL}/${shortCode}`,
    }
  }
}
