import type { IRepository } from '@domain/persistence/repository'
import { InjectRepository } from '@infra/decorators/inject-repository.decorator'
import type { CreateUrlInput, IUrlRepository } from '@infra/repositories/url/url.repository'
import { Injectable } from '@lidcode/framework'
import type { ShortenedUrl } from '@prisma/client'

@Injectable({
  token: 'IUrlRepository',
})
export class UrlRepository implements IUrlRepository {
  constructor(
    @InjectRepository('ShortenedUrl')
    private readonly repository: IRepository<ShortenedUrl>,
  ) {}

  async create(input: CreateUrlInput): Promise<ShortenedUrl> {
    return this.repository.createOne(input)
  }

  async findById(id: number): Promise<ShortenedUrl | null> {
    return this.repository.findById(id)
  }

  async findByShortCode(shortCode: string): Promise<ShortenedUrl | null> {
    return this.repository.findUnique({
      where: { shortCode },
    })
  }
}
