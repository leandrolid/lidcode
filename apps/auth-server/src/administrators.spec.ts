import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { test } from 'node:test'
import { eq } from 'drizzle-orm'
import { bootstrapAdministrator } from './application/usecases/bootstrap-administrator.js'
import { user } from './infra/adapters/drizzle/schemas/auth.js'
import { createHttpFixture, json } from './test/http.js'
import { registerUser } from './test/oauth.js'

test('only an explicit verified-account bootstrap grants server-authoritative administrator access', async () => {
  const fixture = await createHttpFixture()
  try {
    const operator = await registerUser(fixture, 'operator@example.com')
    const ordinary = await registerUser(fixture)
    await fixture.request(
      '/api/auth/sign-up/email',
      json({
        name: 'Unverified',
        email: 'unverified@example.com',
        password: 'test-password-123',
        role: 'admin',
      }),
    )
    assert.equal(
      await bootstrapAdministrator(fixture.store.database, 'unknown@example.com'),
      'not_found',
    )
    assert.equal(
      await bootstrapAdministrator(fixture.store.database, 'unverified@example.com'),
      'unverified',
    )
    assert.equal((await fixture.request('/api/v1/admin/oauth-clients')).status, 401)
    assert.equal((await ordinary.browser.request('/api/v1/admin/oauth-clients')).status, 403)
    for (let attempt = 0; attempt < 2; attempt++) {
      assert.equal(
        await bootstrapAdministrator(fixture.store.database, operator.user.email),
        'assigned',
      )
    }
    assert.equal((await operator.browser.request('/api/v1/admin/oauth-clients')).status, 200)
    await fixture.store.database
      .update(user)
      .set({ role: 'user' })
      .where(eq(user.id, operator.user.id))
    assert.equal((await operator.browser.request('/api/v1/admin/oauth-clients')).status, 403)
    const unverified = await fixture.store.database.query.user.findFirst({
      where: eq(user.email, 'unverified@example.com'),
    })
    assert.equal(unverified?.role, 'user')

    for (const email of [operator.user.email, 'unverified@example.com', 'unknown@example.com']) {
      const child = spawn(
        process.execPath,
        ['--import', 'tsx', 'src/commands/bootstrap-admin.ts', email],
        {
          cwd: new URL('../', import.meta.url),
          env: { AUTH_DATABASE_URL: fixture.store.url, AUTH_DATABASE_SSL: 'false' },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      )
      let output = ''
      child.stdout.setEncoding('utf8').on('data', (chunk: string) => {
        output += chunk
      })
      child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
        output += chunk
      })
      const [code] = await once(child, 'exit')
      assert.equal(code, email === operator.user.email ? 0 : 1, output)
      assert.ok(!output.includes(fixture.store.url))
    }
  } finally {
    await fixture.close()
  }
})
