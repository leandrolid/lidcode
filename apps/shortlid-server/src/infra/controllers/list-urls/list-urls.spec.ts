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

import { ListUrlsController } from './list-urls.controller'

describe('ListUrlsController', () => {
  const mockRepository = {
    findByUserId: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByShortCode: jest.fn(),
    deleteByIdAndUserId: jest.fn(),
    deleteExpiredLinks: jest.fn(),
  }

  const controller = new ListUrlsController(mockRepository as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return user URLs', async () => {
    const user = { id: 'user-1', email: 'test@test.com', name: 'Test' }
    const expectedUrls = [
      {
        id: 1,
        originalUrl: 'https://example.com',
        shortCode: 'abc',
        userId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    ]
    mockRepository.findByUserId.mockResolvedValue(expectedUrls)

    const result = await controller.execute(user)

    expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-1')
    expect(result).toEqual(expectedUrls)
  })

  it('should return empty array when no URLs', async () => {
    mockRepository.findByUserId.mockResolvedValue([])

    const result = await controller.execute({ id: 'user-2', email: 'x@x.com', name: 'X' })

    expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-2')
    expect(result).toEqual([])
  })
})
