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
import { and, lt, isNull } from 'drizzle-orm'

describe('ExpireLinksCron — deleteExpiredLinks', () => {
  function createMockDatabase(executeResult: unknown[] = []) {
    const mockExecute = jest.fn().mockResolvedValue(executeResult)
    const mockReturning = jest.fn().mockReturnValue({ execute: mockExecute })
    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning })
    const mockDelete = jest.fn().mockReturnValue({ where: mockWhere })
    const db = { delete: mockDelete }

    return { db, mockDelete, mockWhere, mockReturning, mockExecute }
  }

  it('should only delete anonymous URLs (where user_id IS NULL)', async () => {
    const { db, mockDelete, mockWhere, mockExecute } = createMockDatabase([
      { id: 1 },
      { id: 2 },
    ])

    const repository = new UrlRepository(db as any)
    const expirationDate = new Date('2025-01-01')

    const result = await repository.deleteExpiredLinks(expirationDate)

    expect(mockDelete).toHaveBeenCalledWith(schema.shortenedUrls)

    const whereArg = mockWhere.mock.calls[0][0]
    const expected = and(
      lt(schema.shortenedUrls.createdAt, expirationDate),
      isNull(schema.shortenedUrls.userId),
    )
    expect(whereArg).toEqual(expected)
    expect(result).toBe(2)
  })

  it('should NOT use only the date filter — must include isNull(userId)', async () => {
    const { db, mockWhere } = createMockDatabase([])

    const repository = new UrlRepository(db as any)
    const expirationDate = new Date('2025-01-01')

    await repository.deleteExpiredLinks(expirationDate)

    const whereArg = mockWhere.mock.calls[0][0]
    const onlyDateFilter = lt(schema.shortenedUrls.createdAt, expirationDate)

    // The WHERE clause must NOT be just the date filter alone
    expect(whereArg).not.toEqual(onlyDateFilter)
  })

  it('should return 0 when no expired anonymous links exist', async () => {
    const { db } = createMockDatabase([])

    const repository = new UrlRepository(db as any)
    const expirationDate = new Date('2025-01-01')

    const result = await repository.deleteExpiredLinks(expirationDate)

    expect(result).toBe(0)
  })
})
