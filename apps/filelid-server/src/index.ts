import 'reflect-metadata'
import { env } from '@/env'
import { MAX_SHARE_BYTES, MAX_SHARE_FILES } from '@domain/sharing'
import { AppModule } from '@infra/adapters/nest/__root'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'

async function main() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      requestTimeout: 10 * 60 * 1000,
      bodyLimit: MAX_SHARE_BYTES + 1024 * 1024,
    }),
  )
  app.enableCors({
    origin: env.FILELID_CORS_ORIGINS,
    methods: ['GET', 'HEAD', 'POST', 'DELETE', 'OPTIONS'],
  })
  app.enableShutdownHooks()
  await app.register(multipart, {
    throwFileSizeLimit: false,
    limits: {
      files: MAX_SHARE_FILES,
      fields: 0,
      parts: MAX_SHARE_FILES,
      fileSize: MAX_SHARE_BYTES,
    },
  })
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' })
  app
    .getHttpAdapter()
    .getInstance()
    .addHook('onRequest', async (_request, reply) => {
      reply.header('cache-control', 'private, no-store')
      reply.header('x-content-type-options', 'nosniff')
      reply.header('referrer-policy', 'no-referrer')
    })
  if (env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Filelid')
        .setDescription('Temporary file sharing')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    )
    SwaggerModule.setup('v1/docs', app, cleanupOpenApiDoc(document))
  }
  await app.listen({ port: env.FILELID_PORT, host: '0.0.0.0' })
  Logger.log(`Filelid API listening on port ${env.FILELID_PORT}`, 'Bootstrap')
}

main().catch((error: unknown) => {
  Logger.error(error, undefined, 'Bootstrap')
  process.exitCode = 1
})
