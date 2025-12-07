import { PrismaClient } from '@infra/adapters/prisma/generated'

const prisma = new PrismaClient({
  log: ['query', 'error', 'info', 'warn'],
})

const main = async () => {}

main()
