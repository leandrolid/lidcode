import { PrismaDatabaseConnection } from '@infra/adapters/prisma/connection.imp'
import { PrismaRepository } from '@infra/adapters/prisma/repository.imp'
import { createParamDecorator } from '@nestjs/common'
import type { Prisma } from '@prisma/client'

export const InjectRepository = createParamDecorator((modelName: Prisma.ModelName) => {
  const connection = PrismaDatabaseConnection.getInstance()
  return new PrismaRepository(connection, modelName)
})
