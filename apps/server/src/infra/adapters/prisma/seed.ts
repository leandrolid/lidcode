import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'error', 'info', 'warn'],
})

const main = async () => {}

main()
