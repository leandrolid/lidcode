import { env } from '@/env'
import { RootModule } from '@infra/adapters/nest/__root'
import { HttpExceptionFilter } from '@infra/adapters/nest/error-handler'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'

const logger = new Logger('Bootstrap')

async function main() {
  const app = await NestFactory.create<NestFastifyApplication>(
    RootModule,
    new FastifyAdapter({
      logger: {
        level: 'error',
      },
    }),
  )
  app.enableCors()
  app.useGlobalFilters(new HttpExceptionFilter())
  await app.listen(env.PORT, () => {
    logger.debug(`Server is running at http://localhost:${env.PORT}`)
  })
}

main()
