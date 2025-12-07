import { PrismaDatabaseConnection } from '@infra/adapters/prisma/connection.imp'
import type { Prisma } from '@infra/adapters/prisma/generated'
import { PrismaRepository } from '@infra/adapters/prisma/repository.imp'
import { createParamDecorator } from '@nestjs/common'

export const InjectRepository = createParamDecorator((modelName: Prisma.ModelName) => {
  const connection = PrismaDatabaseConnection.getInstance()
  return new PrismaRepository(connection, modelName)
})
