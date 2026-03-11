import { cleanupOpenApiDoc } from 'nestjs-zod'
import { env } from '@/env'
import { AppModule } from '@infra/adapters/nest/__root'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import path from 'node:path'
import '@fastify/static'
import fastifyCompress from '@fastify/compress'
import { AuthService } from '@thallesp/nestjs-better-auth'
import { toNodeHandler } from 'better-auth/node'
import type { Auth } from 'better-auth'

const logger = new Logger('Bootstrap')

async function main() {
  const fastifyAdapter = new FastifyAdapter({
    logger: {
      level: 'error',
    },
  })

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    { bodyParser: false },
  )
  // CORS configuration
  const corsOrigins =
    env.NODE_ENV === 'development' && env.CORS_ORIGINS.length === 0
      ? ['http://localhost:3000', 'http://localhost:5173']
      : env.CORS_ORIGINS

  app.enableCors({
    origin:
      env.NODE_ENV === 'production' && corsOrigins.length === 0
        ? false // Deny all in prod if not configured
        : corsOrigins,
    credentials: true,
  })
  app.register(fastifyCompress, {
    encodings: ['gzip', 'deflate'],
  })
  app.useStaticAssets({
    root: path.resolve(__dirname, 'static'),
    cacheControl: true,
    maxAge: 604800000, // 1 week
    immutable: true,
  })
  setupSwagger(app)
  await registerBetterAuthRoutes(app)
  await app.listen(
    {
      port: env.PORT,
      host: '0.0.0.0',
    },
    () => {
      logger.debug(`Server is running at http://localhost:${env.PORT}`)
    },
  )
}

async function registerBetterAuthRoutes(app: NestFastifyApplication) {
  const authService = app.get<AuthService<Auth>>(AuthService)
  const betterAuthHandler = toNodeHandler(authService.instance.handler)
  const fastify = app.getHttpAdapter().getInstance()

  // Register in a scoped Fastify plugin to isolate content-type parser removal.
  // This is CRITICAL: Fastify's default parsers consume the IncomingMessage body stream.
  // Without this, POST requests (sign-in, sign-up) receive empty bodies and fail silently.
  // The scoped plugin ensures only /v1/auth/* routes bypass Fastify's body parsing.
  await fastify.register(async (scope: typeof fastify) => {
    scope.removeAllContentTypeParsers()
    scope.addContentTypeParser('*', (_req: any, _payload: any, done: (err: null) => void) => {
      done(null)
    })

    scope.all('/v1/auth/*', async (request, reply) => {
      reply.hijack()
      try {
        await betterAuthHandler(request.raw, reply.raw)
      } catch (err) {
        if (!reply.raw.headersSent) {
          reply.raw.writeHead(500, { 'content-type': 'application/json' })
          reply.raw.end(JSON.stringify({ error: 'Internal Server Error' }))
        }
      }
    })
  })

  logger.debug('Better Auth routes registered on /v1/auth/*')
}

function setupSwagger(app: NestFastifyApplication) {
  if (env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Auth Server')
        .setDescription('API documentation for the Auth Server service')
        .setVersion('1.0')
        .addBearerAuth()
        .addBasicAuth()
        .setExternalDoc('JSON', '/docs.json')
        .build(),
    )
    SwaggerModule.setup('v1/docs', app, cleanupOpenApiDoc(document), {
      swaggerOptions: {
        persistAuthorization: true,
      },
      jsonDocumentUrl: 'docs.json',
    })
  }
}

main()
