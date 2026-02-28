/* eslint-disable turbo/no-undeclared-env-vars */
import { defineConfig } from 'drizzle-kit'

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
    url: process.env.DATABASE_URL!,
    ssl:
      process.env.NODE_ENV === 'production'
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
  },
})
