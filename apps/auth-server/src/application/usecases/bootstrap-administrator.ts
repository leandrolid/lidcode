import { and, eq } from 'drizzle-orm'
import type { createDatabase } from '../../infra/adapters/drizzle/client.js'
import { user } from '../../infra/adapters/drizzle/schemas/auth.js'

export async function bootstrapAdministrator(
  database: ReturnType<typeof createDatabase>['database'],
  email: string,
) {
  const assigned = await database
    .update(user)
    .set({ role: 'admin' })
    .where(and(eq(user.email, email.trim().toLowerCase()), eq(user.emailVerified, true)))
    .returning({ id: user.id })
  if (assigned.length) return 'assigned'
  const existing = await database.query.user.findFirst({
    where: eq(user.email, email.trim().toLowerCase()),
    columns: { id: true },
  })
  return existing ? 'unverified' : 'not_found'
}
