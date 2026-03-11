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

import type { AuthUser, IAuthService } from '@domain/services/auth.service'
import { AuthGuard } from '@infra/adapters/nest/auth.guard'
import { UnauthorizedException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { ExecutionContext } from '@nestjs/common'

type MockRequest = {
  headers: { cookie?: string }
  user?: AuthUser
}

describe('AuthGuard', () => {
  function createContext(options?: { cookie?: string; requireAuth?: boolean }) {
    const mockRequest: MockRequest = {
      headers: { cookie: options?.cookie },
      user: undefined,
    }

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext

    const mockReflector = {
      getAllAndOverride: jest.fn().mockReturnValue(options?.requireAuth ?? false),
    } as unknown as Reflector

    return { mockRequest, mockContext, mockReflector }
  }

  it('returns true and sets request user when cookie session is valid', async () => {
    const authService: IAuthService = {
      validateSession: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'john@lidcode.dev',
        name: 'John',
      }),
    }
    const { mockRequest, mockContext, mockReflector } = createContext({
      cookie: 'sid=valid',
    })
    const guard = new AuthGuard(authService, mockReflector)

    const result = await guard.canActivate(mockContext)

    expect(result).toBe(true)
    expect(authService.validateSession).toHaveBeenCalledWith('sid=valid')
    expect(mockRequest.user).toEqual({
      id: 'user-1',
      email: 'john@lidcode.dev',
      name: 'John',
    })
  })

  it('returns true and keeps request user undefined when cookie is missing', async () => {
    const authService: IAuthService = {
      validateSession: jest.fn().mockResolvedValue(null),
    }
    const { mockRequest, mockContext, mockReflector } = createContext()
    const guard = new AuthGuard(authService, mockReflector)

    const result = await guard.canActivate(mockContext)

    expect(result).toBe(true)
    expect(authService.validateSession).not.toHaveBeenCalled()
    expect(mockRequest.user).toBeUndefined()
  })

  it('returns true and keeps request user undefined when session is invalid', async () => {
    const authService: IAuthService = {
      validateSession: jest.fn().mockResolvedValue(null),
    }
    const { mockRequest, mockContext, mockReflector } = createContext({
      cookie: 'sid=invalid',
    })
    const guard = new AuthGuard(authService, mockReflector)

    const result = await guard.canActivate(mockContext)

    expect(result).toBe(true)
    expect(authService.validateSession).toHaveBeenCalledWith('sid=invalid')
    expect(mockRequest.user).toBeUndefined()
  })

  it('returns true for @RequireAuth route when session is valid', async () => {
    const authService: IAuthService = {
      validateSession: jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'john@lidcode.dev',
        name: 'John',
      }),
    }
    const { mockContext, mockReflector } = createContext({
      cookie: 'sid=valid',
      requireAuth: true,
    })
    const guard = new AuthGuard(authService, mockReflector)

    const result = await guard.canActivate(mockContext)

    expect(result).toBe(true)
  })

  it('throws UnauthorizedException for @RequireAuth route with no session', async () => {
    const authService: IAuthService = {
      validateSession: jest.fn().mockResolvedValue(null),
    }
    const { mockContext, mockReflector } = createContext({ requireAuth: true })
    const guard = new AuthGuard(authService, mockReflector)

    await expect(guard.canActivate(mockContext)).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
