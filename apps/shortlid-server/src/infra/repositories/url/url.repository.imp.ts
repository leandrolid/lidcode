import type { ShortenedUrl } from '@domain/entities/shortened-url.entity'
import { Drizzle, InjectDrizzle } from '@infra/adapters/drizzle/client'
import * as schema from '@infra/adapters/drizzle/schemas'
import type { CreateUrlInput, IUrlRepository } from '@infra/repositories/url/url.repository'
import { ConflictException, Injectable } from '@nestjs/common'
import { and, eq, isNull, lt } from 'drizzle-orm'

@Injectable()
export class UrlRepository implements IUrlRepository {
  constructor(
    @InjectDrizzle()
    private readonly database: Drizzle,
  ) {}

  async create(input: CreateUrlInput): Promise<ShortenedUrl> {
    const [shortUrl] = await this.database
      .insert(schema.shortenedUrls)
      .values({
        id: input.id,
        originalUrl: input.originalUrl,
        shortCode: input.shortCode,
        userId: input.userId,
      })
      .returning()
      .execute()
    if (!shortUrl) {
      throw new ConflictException('Failed to create shortened URL')
    }
    return shortUrl
  }

  async findById(id: number): Promise<ShortenedUrl | null> {
    const [shortUrl] = await this.database
      .select()
      .from(schema.shortenedUrls)
      .where(eq(schema.shortenedUrls.id, id))
      .limit(1)
      .offset(0)
    return shortUrl || null
  }

  async findByShortCode(shortCode: string): Promise<ShortenedUrl | null> {
    const [shortUrl] = await this.database
      .select()
      .from(schema.shortenedUrls)
      .where(eq(schema.shortenedUrls.shortCode, shortCode))
      .limit(1)
      .offset(0)
    return shortUrl || null
  }

  async findByUserId(userId: string): Promise<ShortenedUrl[]> {
    return this.database
      .select()
      .from(schema.shortenedUrls)
      .where(eq(schema.shortenedUrls.userId, userId))
  }

  async deleteByIdAndUserId(id: number, userId: string): Promise<boolean> {
    const result = await this.database
      .delete(schema.shortenedUrls)
      .where(and(eq(schema.shortenedUrls.id, id), eq(schema.shortenedUrls.userId, userId)))
      .returning()
      .execute()
    return result.length > 0
  }

  async deleteExpiredLinks(expirationDate: Date): Promise<number> {
    const result = await this.database
      .delete(schema.shortenedUrls)
      .where(and(lt(schema.shortenedUrls.createdAt, expirationDate), isNull(schema.shortenedUrls.userId)))
      .returning()
      .execute()
    return result.length
  }
}
