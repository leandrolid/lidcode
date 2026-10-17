import { z } from 'zod'
import { bootstrapAdministrator } from '../application/usecases/bootstrap-administrator.js'
import { createDatabase } from '../infra/adapters/drizzle/client.js'

try {
  const email = z.email().parse(process.argv[2])
  const input = z
    .object({
      AUTH_DATABASE_URL: z.url(),
      AUTH_DATABASE_SSL: z.enum(['true', 'false']).default('false'),
    })
    .parse(process.env)
  const database = createDatabase({
    AUTH_DATABASE_URL: input.AUTH_DATABASE_URL,
    AUTH_DATABASE_SSL: input.AUTH_DATABASE_SSL === 'true',
  })
  try {
    const result = await bootstrapAdministrator(database.database, email)
    if (result === 'assigned') console.log('Administrator access assigned')
    else {
      console.error(
        result === 'unverified'
          ? 'Verify the existing account email before assigning administrator access'
          : 'Register and verify the account before assigning administrator access',
      )
      process.exitCode = 1
    }
  } finally {
    await database.close()
  }
} catch {
  console.error(
    'Bootstrap failed: provide an account email, AUTH_DATABASE_URL, and valid database settings',
  )
  process.exitCode = 1
}
