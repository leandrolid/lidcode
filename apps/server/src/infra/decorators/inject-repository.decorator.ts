import { createDecorator, Scope } from '@lidcode/framework'
import { PrismaDatabaseConnection } from '@infra/adapters/prisma/connection.imp'
import { PrismaRepository } from '@infra/adapters/prisma/repository.imp'
import type { Prisma } from '@prisma/client'

export function InjectRepository(modelName: Prisma.ModelName) {
  return createDecorator(`BaseRepository<${modelName}>`, {
    scope: Scope.Singleton,
    useFactory: () => {
      const connection = PrismaDatabaseConnection.getInstance()
      return new PrismaRepository(connection, modelName)
    },
  })
}
