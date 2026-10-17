import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTestDatabase } from '../../../test/database.js'

test('provider migrations apply to an empty PostgreSQL database and are repeatable', async () => {
  const fixture = await createTestDatabase()
  try {
    const before = await fixture.pool.query<{ count: string }>(
      "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'",
    )
    assert.equal(before.rows[0]?.count, '0')
    await fixture.migrate()
    const first = await fixture.pool.query('SELECT * FROM drizzle.__drizzle_migrations')
    await fixture.migrate()
    const second = await fixture.pool.query('SELECT * FROM drizzle.__drizzle_migrations')
    assert.ok(first.rowCount && first.rowCount > 0)
    assert.deepEqual(second.rows, first.rows)

    const tables = await fixture.pool.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
    )
    for (const name of [
      'user',
      'session',
      'account',
      'verification',
      'jwks',
      'oauth_client',
      'oauth_resource',
      'oauth_client_resource',
      'oauth_refresh_token',
      'oauth_access_token',
      'oauth_consent',
      'oauth_client_assertion',
      'rate_limit',
    ]) {
      assert.ok(
        tables.rows.some((table) => table.tablename === name),
        `Missing ${name}`,
      )
    }
    const result = await fixture.pool.query<{ role: string }>(
      `INSERT INTO "user" (id, name, email) VALUES ('role-test', 'Test', 'role@example.com') RETURNING role`,
    )
    assert.equal(result.rows[0]?.role, 'user')
  } finally {
    await fixture.close()
  }
})
