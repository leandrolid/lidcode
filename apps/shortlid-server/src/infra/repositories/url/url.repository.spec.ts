jest.mock('@/env', () => ({
  env: {
    PORT: 3333,
    NODE_ENV: 'test',
    BASE_URL: 'http://localhost:3333',
    DATABASE_URL: 'postgresql://localhost:5432/shortlid',
    REDIS_URL: 'redis://localhost:6379',
    HASH_CODE_SALT: 'test-salt-1234',
    AUTH_SERVER_URL: 'http://localhost:3334',
    CORS_ORIGINS: [],
  },
}))

jest.mock('pg', () => ({
  Pool: jest.fn(),
}))

import * as schema from '@infra/adapters/drizzle/schemas'
import { UrlRepository } from '@infra/repositories/url/url.repository.imp'
import { and, eq } from 'drizzle-orm'

function createInsertMockDatabase(executeResult: unknown[] = []) {
  const mockExecute = jest.fn().mockResolvedValue(executeResult)
  const mockReturning = jest.fn().mockReturnValue({ execute: mockExecute })
  const mockValues = jest.fn().mockReturnValue({ returning: mockReturning })
  const mockInsert = jest.fn().mockReturnValue({ values: mockValues })
  const db = { insert: mockInsert }

  return { db, mockInsert, mockValues, mockReturning, mockExecute }
}

function createSelectMockDatabase(result: unknown[] = []) {
  const mockOffset = jest.fn().mockResolvedValue(result)
  const mockLimit = jest.fn().mockReturnValue({ offset: mockOffset })
  const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit })
  const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
  const mockSelect = jest.fn().mockReturnValue({ from: mockFrom })
  const db = { select: mockSelect }

  return { db, mockSelect, mockFrom, mockWhere, mockLimit, mockOffset }
}

function createSelectListMockDatabase(result: unknown[] = []) {
  const mockWhere = jest.fn().mockResolvedValue(result)
  const mockFrom = jest.fn().mockReturnValue({ where: mockWhere })
  const mockSelect = jest.fn().mockReturnValue({ from: mockFrom })
  const db = { select: mockSelect }

  return { db, mockSelect, mockFrom, mockWhere }
}

function createDeleteMockDatabase(executeResult: unknown[] = []) {
  const mockExecute = jest.fn().mockResolvedValue(executeResult)
  const mockReturning = jest.fn().mockReturnValue({ execute: mockExecute })
  const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning })
  const mockDelete = jest.fn().mockReturnValue({ where: mockWhere })
  const db = { delete: mockDelete }

  return { db, mockDelete, mockWhere, mockReturning, mockExecute }
}

const NOW = new Date('2025-06-01T00:00:00Z')

function makeShortenedUrl(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    originalUrl: 'https://example.com',
    shortCode: 'abc123',
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    userId: null,
    ...overrides,
  }
}

describe('UrlRepository', () => {
  describe('create', () => {
    it('should pass userId to .values() when provided', async () => {
      const urlData = makeShortenedUrl({ userId: 'user-1' })
      const { db, mockInsert, mockValues } = createInsertMockDatabase([urlData])

      const repository = new UrlRepository(db as any)
      const result = await repository.create({
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        userId: 'user-1',
      })

      expect(mockInsert).toHaveBeenCalledWith(schema.shortenedUrls)
      expect(mockValues).toHaveBeenCalledWith({
        id: undefined,
        originalUrl: 'https://example.com',
        shortCode: 'abc123',
        userId: 'user-1',
      })
      expect(result).toEqual(urlData)
    })

    it('should pass userId as undefined when not provided (anonymous)', async () => {
      const urlData = makeShortenedUrl()
      const { db, mockValues } = createInsertMockDatabase([urlData])

      const repository = new UrlRepository(db as any)
      await repository.create({
        originalUrl: 'https://example.com',
        shortCode: 'xyz789',
      })

      expect(mockValues).toHaveBeenCalledWith({
        id: undefined,
        originalUrl: 'https://example.com',
        shortCode: 'xyz789',
        userId: undefined,
      })
    })
  })

  describe('findByUserId', () => {
    it('should SELECT with WHERE userId = given value', async () => {
      const urls = [
        makeShortenedUrl({ id: 1, shortCode: 'aaa', userId: 'user-42' }),
        makeShortenedUrl({ id: 2, shortCode: 'bbb', userId: 'user-42' }),
      ]
      const { db, mockSelect, mockFrom, mockWhere } = createSelectListMockDatabase(urls)

      const repository = new UrlRepository(db as any)
      const result = await repository.findByUserId('user-42')

      expect(mockSelect).toHaveBeenCalled()
      expect(mockFrom).toHaveBeenCalledWith(schema.shortenedUrls)

      const whereArg = mockWhere.mock.calls[0][0]
      const expected = eq(schema.shortenedUrls.userId, 'user-42')
      expect(whereArg).toEqual(expected)

      expect(result).toEqual(urls)
    })
  })

  describe('deleteByIdAndUserId', () => {
    it('should return true when URL is deleted (owned by user)', async () => {
      const deletedRow = makeShortenedUrl({ id: 5, userId: 'user-1' })
      const { db, mockDelete, mockWhere } = createDeleteMockDatabase([deletedRow])

      const repository = new UrlRepository(db as any)
      const result = await repository.deleteByIdAndUserId(5, 'user-1')

      expect(mockDelete).toHaveBeenCalledWith(schema.shortenedUrls)

      const whereArg = mockWhere.mock.calls[0][0]
      const expected = and(
        eq(schema.shortenedUrls.id, 5),
        eq(schema.shortenedUrls.userId, 'user-1'),
      )
      expect(whereArg).toEqual(expected)

      expect(result).toBe(true)
    })

    it('should return false when no rows deleted (not found or not owned)', async () => {
      const { db } = createDeleteMockDatabase([])

      const repository = new UrlRepository(db as any)
      const result = await repository.deleteByIdAndUserId(999, 'user-1')

      expect(result).toBe(false)
    })
  })
})
