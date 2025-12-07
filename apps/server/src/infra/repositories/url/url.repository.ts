import type { ShortenedUrl } from '@infra/adapters/prisma/generated'

export interface IUrlRepository {
  create(input: CreateUrlInput): Promise<ShortenedUrl>
  findById(id: number): Promise<ShortenedUrl | null>
  findByShortCode(shortCode: string): Promise<ShortenedUrl | null>
  deleteExpiredLinks(expirationDate: Date): Promise<number>
}

export type CreateUrlInput = {
  id?: number
  originalUrl: string
  shortCode: string
}
