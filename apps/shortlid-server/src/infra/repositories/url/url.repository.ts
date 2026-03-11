import type { ShortenedUrl } from '@domain/entities/shortened-url.entity'

export interface IUrlRepository {
  create(input: CreateUrlInput): Promise<ShortenedUrl>
  findById(id: number): Promise<ShortenedUrl | null>
  findByShortCode(shortCode: string): Promise<ShortenedUrl | null>
  findByUserId(userId: string): Promise<ShortenedUrl[]>
  deleteByIdAndUserId(id: number, userId: string): Promise<boolean>
  deleteExpiredLinks(expirationDate: Date): Promise<number>
}

export type CreateUrlInput = {
  id?: number
  originalUrl: string
  shortCode: string
  userId?: string
}
