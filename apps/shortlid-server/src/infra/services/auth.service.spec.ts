jest.mock('@/env', () => ({
  env: {
    PORT: 3333,
    NODE_ENV: 'test',
    BASE_URL: 'http://localhost:3333',
    DATABASE_URL: 'postgresql://localhost:5432/shortlid',
    REDIS_URL: 'redis://localhost:6379',
    HASH_CODE_SALT: 'test-salt-1234',
    AUTH_SERVER_URL: 'http://localhost:3340',
    CORS_ORIGINS: [],
  },
}))

import { AuthService } from '@infra/services/auth.service.imp'

describe('AuthService', () => {
  const cookieHeader = 'session=test-cookie'

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns user for a valid session', async () => {
    const service = new AuthService()

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'user-1', email: 'test@test.com', name: 'Test User' }),
    } as Response)

    const result = await service.validateSession(cookieHeader)

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3340/v1/me', {
      headers: { Cookie: cookieHeader },
    })
    expect(result).toEqual({ id: 'user-1', email: 'test@test.com', name: 'Test User' })
  })

  it('returns null when session is invalid (401)', async () => {
    const service = new AuthService()

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response)

    const result = await service.validateSession(cookieHeader)

    expect(result).toBeNull()
  })

  it('returns null when auth server responds with 500', async () => {
    const service = new AuthService()

    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const result = await service.validateSession(cookieHeader)

    expect(result).toBeNull()
  })

  it('returns null when fetch throws network error', async () => {
    const service = new AuthService()

    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    const result = await service.validateSession(cookieHeader)

    expect(result).toBeNull()
  })
})
