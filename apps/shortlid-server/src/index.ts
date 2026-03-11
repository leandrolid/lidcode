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

const logger = new Logger('Bootstrap')

async function main() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: 'error',
      },
    }),
  )
  app.enableCors({
    origin: env.CORS_ORIGINS,
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

function setupSwagger(app: NestFastifyApplication) {
  if (env.NODE_ENV !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('ShortLid - URL Shortener')
        .setDescription('API documentation for the ShortLid URL Shortener service')
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
