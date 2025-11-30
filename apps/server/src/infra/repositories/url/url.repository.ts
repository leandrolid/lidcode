import type { ShortenedUrl } from '@prisma/client'

export interface IUrlRepository {
  create(input: CreateUrlInput): Promise<ShortenedUrl>
  findById(id: number): Promise<ShortenedUrl | null>
  findByShortCode(shortCode: string): Promise<ShortenedUrl | null>
}

export type CreateUrlInput = {
  id?: number
  originalUrl: string
  shortCode: string
}
