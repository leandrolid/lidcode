import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: {
    kind: 'single',
    filePath: './src/infra/adapters/prisma/schema.prisma',
  },
})
