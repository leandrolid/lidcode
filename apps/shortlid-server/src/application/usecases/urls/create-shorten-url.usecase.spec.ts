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

import { CreateShortenUrlUsecase } from './create-shorten-url.usecase'

const mockRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByShortCode: jest.fn(),
  findByUserId: jest.fn(),
  deleteByIdAndUserId: jest.fn(),
  deleteExpiredLinks: jest.fn(),
}

const mockShortCodeService = {
  createFromId: jest.fn(),
  getIdFromCode: jest.fn(),
}

const mockCounterService = {
  getCountFor: jest.fn(),
}

describe('CreateShortenUrlUsecase', () => {
  let usecase: CreateShortenUrlUsecase

  beforeEach(() => {
    jest.clearAllMocks()

    mockCounterService.getCountFor.mockResolvedValue(1)
    mockShortCodeService.createFromId.mockReturnValue('abc')
    mockRepository.create.mockResolvedValue({
      id: 1,
      shortCode: 'abc',
      originalUrl: 'https://example.com',
      userId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })

    usecase = new CreateShortenUrlUsecase(
      mockShortCodeService as any,
      mockCounterService as any,
      mockRepository as any,
    )
  })

  it('should create a shortened URL for anonymous user (no userId)', async () => {
    const result = await usecase.execute({ originalUrl: 'https://example.com' })

    expect(mockCounterService.getCountFor).toHaveBeenCalledWith('url_counter')
    expect(mockShortCodeService.createFromId).toHaveBeenCalledWith(1)
    expect(mockRepository.create).toHaveBeenCalledWith({
      id: 1,
      originalUrl: 'https://example.com',
      shortCode: 'abc',
      userId: undefined,
    })

    expect(result).toEqual({
      id: 1,
      shortUrl: 'http://localhost:3333/abc',
      originalUrl: 'https://example.com',
    })
  })

  it('should create a shortened URL for authenticated user (with userId)', async () => {
    mockRepository.create.mockResolvedValue({
      id: 1,
      shortCode: 'abc',
      originalUrl: 'https://example.com',
      userId: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    })

    const result = await usecase.execute({
      originalUrl: 'https://example.com',
      userId: 'user-123',
    })

    expect(mockRepository.create).toHaveBeenCalledWith({
      id: 1,
      originalUrl: 'https://example.com',
      shortCode: 'abc',
      userId: 'user-123',
    })

    expect(result).toEqual({
      id: 1,
      shortUrl: 'http://localhost:3333/abc',
      originalUrl: 'https://example.com',
    })
  })

  it('should return id in the response', async () => {
    const result = await usecase.execute({ originalUrl: 'https://example.com' })

    expect(result).toHaveProperty('id')
    expect(result.id).toBe(1)
  })
})
