import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infra/adapters/drizzle/schemas/index.ts',
  out: './src/infra/adapters/drizzle/migrations',
  dbCredentials: {
    url: process.env.FILELID_DATABASE_URL ?? 'postgresql://localhost:5432/filelid',
    ssl: process.env.FILELID_DATABASE_SSL === 'true',
  },
})
