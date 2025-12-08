import dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'
import path from 'node:path'

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

export default defineConfig({
  dialect: 'postgresql',
  out: './src/infra/adapters/drizzle/migrations',
  schema: './src/infra/adapters/drizzle/schemas/index.ts',
  casing: 'snake_case',
  migrations: {
    table: 'drizzle_migrations',
    prefix: 'timestamp',
  },
  dbCredentials: {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    url: process.env.HEROKU_POSTGRESQL_ROSE_URL!,
  },
})
