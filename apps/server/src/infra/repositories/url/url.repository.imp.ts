import type { IRepository } from '@domain/persistence/repository'
import type { CreateUrlInput, IUrlRepository } from '@infra/repositories/url/url.repository'
import { Inject, Injectable } from '@nestjs/common'
import type { ShortenedUrl } from '@prisma/client'

// @Injectable({
//   token: 'IUrlRepository',
// })
@Injectable()
export class UrlRepository implements IUrlRepository {
  constructor(
    @Inject('ShortenedUrl')
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

  async deleteExpiredLinks(expirationDate: Date): Promise<number> {
    const result = await this.repository.deleteMany({
      where: {
        createdAt: {
          lt: expirationDate,
        },
      },
    })
    return result.count
  }
}
