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

import { NotFoundException } from '@nestjs/common'

import { DeleteUrlController } from './delete-url.controller'

describe('DeleteUrlController', () => {
  const mockRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByShortCode: jest.fn(),
    findByUserId: jest.fn(),
    deleteByIdAndUserId: jest.fn(),
    deleteExpiredLinks: jest.fn(),
  }

  const controller = new DeleteUrlController(mockRepository as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should delete owned URL successfully (returns undefined for 204)', async () => {
    mockRepository.deleteByIdAndUserId.mockResolvedValue(true)
    const user = { id: 'user-1', email: 'test@test.com', name: 'Test' }

    const result = await controller.execute('1', user)

    expect(mockRepository.deleteByIdAndUserId).toHaveBeenCalledWith(1, 'user-1')
    expect(result).toBeUndefined()
  })

  it('should throw NotFoundException for non-existent or unowned URL', async () => {
    mockRepository.deleteByIdAndUserId.mockResolvedValue(false)
    const user = { id: 'user-1', email: 'test@test.com', name: 'Test' }

    await expect(controller.execute('2', user)).rejects.toThrow(NotFoundException)
  })

  it('should parse string id to number before calling repository', async () => {
    mockRepository.deleteByIdAndUserId.mockResolvedValue(true)
    const user = { id: 'user-3', email: 'a@b.com', name: 'A' }

    await controller.execute('42', user)

    expect(mockRepository.deleteByIdAndUserId).toHaveBeenCalledWith(42, 'user-3')
  })
})
