import { cp } from 'node:fs/promises'
import { URL } from 'node:url'

await cp(
  new URL('../src/infra/adapters/drizzle/migrations/', import.meta.url),
  new URL('../dist/infra/adapters/drizzle/migrations/', import.meta.url),
  { recursive: true },
)
