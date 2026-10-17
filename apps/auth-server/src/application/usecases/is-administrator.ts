import { eq } from 'drizzle-orm'
import type { createDatabase } from '../../infra/adapters/drizzle/client.js'
import { user } from '../../infra/adapters/drizzle/schemas/auth.js'

export async function isAdministrator(
  database: ReturnType<typeof createDatabase>['database'],
  userId?: string,
) {
  if (!userId) return false
  const current = await database.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { role: true, emailVerified: true },
  })
  return current?.role === 'admin' && current.emailVerified
}
