// Set environment variables before any imports that use env
process.env.BASE_URL = 'http://localhost:3340'
process.env.BETTER_AUTH_SECRET = 'test-secret-key-that-is-at-least-32-characters-long'
process.env.BETTER_AUTH_URL = 'http://localhost:3340'
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.RESEND_FROM_EMAIL = 'test@example.com'
process.env.DATABASE_URL = 'postgresql://localhost:5432/testdb'
process.env.REDIS_URL = 'redis://localhost:6379'

import { Test, type TestingModule } from '@nestjs/testing'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import { FastifyAdapter } from '@nestjs/platform-fastify'
import { DrizzleAsyncProvider } from '@infra/adapters/drizzle/client'
import { HealthzController } from '@infra/controllers/healthz/healthz.controller'
import { GetMeController } from '@infra/controllers/me/get-me.controller'
import { ListUsersController } from '@infra/controllers/admin/list-users.controller'
import { RolesGuard } from '@infra/adapters/nest/roles.guard'
import { Reflector } from '@nestjs/core'

type AuthSession = {
  user: {
    id: string
    email: string
    name: string
    role?: string | null
  }
}

describe('auth-server E2E', () => {
  let app: NestFastifyApplication
  let moduleRef: TestingModule

  // Mock Drizzle DB with fake users
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockResolvedValue([
      {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'user-2',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
  }

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [HealthzController, GetMeController, ListUsersController],
      providers: [
        {
          provide: DrizzleAsyncProvider,
          useValue: mockDb,
        },
        Reflector,
        RolesGuard,
      ],
    }).compile()

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter())

    // Add Fastify hook to inject session from header (before init)
    const fastifyInstance = app.getHttpAdapter().getInstance()
    fastifyInstance.addHook('onRequest', async (request: any) => {
      const testSession = request.headers['x-test-session']
      if (testSession) {
        try {
          request.session = JSON.parse(testSession)
        } catch (e) {
          // ignore parse errors
        }
      }
    })

    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  describe('GET /healthz', () => {
    it('should return 200 and status ok', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/healthz',
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toMatchObject({
        status: 'ok',
        version: expect.any(String),
      })
    })
  })

  describe('GET /v1/me', () => {
    it('should return 401 for anonymous user (no session)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/me',
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /v1/admin/users', () => {
    it('should return 401 for anonymous user (no session)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/admin/users',
      })

      // RolesGuard throws 401 when session is missing, 403 when role mismatch
      expect(response.statusCode).toBe(401)
    })

    it('should return 403 for non-admin user', async () => {
      const nonAdminSession: AuthSession = {
        user: {
          id: 'user-2',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
        },
      }

      const response = await app.inject({
        method: 'GET',
        url: '/v1/admin/users',
        headers: {
          'x-test-session': JSON.stringify(nonAdminSession),
        },
      })

      expect(response.statusCode).toBe(403)
    })

    it('should return 200 for admin user', async () => {
      const adminSession: AuthSession = {
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
        },
      }

      const response = await app.inject({
        method: 'GET',
        url: '/v1/admin/users',
        headers: {
          'x-test-session': JSON.stringify(adminSession),
        },
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body).toHaveProperty('users')
      expect(Array.isArray(body.users)).toBe(true)
      expect(body.users.length).toBeGreaterThan(0)
    })
  })
})
