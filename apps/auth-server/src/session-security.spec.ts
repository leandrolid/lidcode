import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture, json } from './test/http.js'
import { approveCode, createTestClients, registerUser } from './test/oauth.js'
import { socialEnvironment } from './test/social.js'

test('cross-origin mutations fail; logout invalidates the old session without removing app approval', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const { browser, user } = await registerUser(fixture)
    await approveCode(browser, alpha)
    const oldCookie = browser.cookie
    for (const [path, method, body] of [
      ['/api/auth/sign-out', 'POST', '{}'],
      ['/api/v1/me', 'PATCH', JSON.stringify({ name: 'Cross-origin edit' })],
      [`/api/v1/authorized-apps/${alpha.client_id}`, 'DELETE', undefined],
    ] as const) {
      const response = await fetch(`${fixture.origin}${path}`, {
        method,
        body,
        headers: {
          origin: 'https://evil.example',
          cookie: oldCookie,
          'content-type': 'application/json',
          'sec-fetch-site': 'cross-site',
        },
      })
      assert.equal(response.status, 403)
    }
    assert.equal((await browser.request('/api/v1/me')).status, 200)
    const logout = await browser.request('/api/auth/sign-out', json({}))
    assert.equal(logout.status, 200)
    assert.equal(
      (await fixture.request('/api/v1/me', { headers: { cookie: oldCookie } })).status,
      401,
    )
    assert.equal((await fixture.store.database.query.appAuthorizations.findMany()).length, 1)
    const approval = await fixture.store.database.query.appAuthorizations.findFirst()
    assert.equal(approval?.userId, user.id)
    assert.equal(approval?.revokedAt, null)
  } finally {
    await fixture.close()
  }
})

test('production sessions set Secure, HttpOnly, SameSite and host-only cookies', async () => {
  const fixture = await createHttpFixture({
    environment: {
      ...socialEnvironment,
      NODE_ENV: 'production',
      AUTH_PUBLIC_ORIGIN: 'https://accounts.example.com',
      AUTH_DATABASE_SSL: 'false',
      AUTH_RESEND_API_KEY: 'captured-production-test-key',
      AUTH_EMAIL_FROM: 'accounts@example.com',
    },
  })
  try {
    const { user } = await registerUser(fixture)
    const response = await fixture.request(
      '/api/auth/sign-in/email',
      json({ email: user.email, password: 'test-only-password-123' }),
    )
    assert.equal(response.status, 200)
    const cookie = response.headers.getSetCookie().find((value) => value.includes('session_token='))
    assert.ok(cookie)
    assert.match(cookie, /; Secure(?:;|$)/i)
    assert.match(cookie, /; HttpOnly(?:;|$)/i)
    assert.match(cookie, /SameSite=Lax/i)
    assert.doesNotMatch(cookie, /Domain=/i)
  } finally {
    await fixture.close()
  }
})

test('account-operation limits persist across independent servers and ignore spoofed IP headers', async () => {
  const first = await createHttpFixture()
  const second = await createHttpFixture({ databaseUrl: first.store.url })
  try {
    for (const path of [
      '/api/auth/send-verification-email',
      '/api/auth/request-password-reset',
      '/api/auth/sign-in/email',
      '/api/auth/sign-up/email',
    ]) {
      const results = []
      for (let attempt = 0; attempt < 4; attempt++) {
        const fixture = attempt % 2 === 0 ? first : second
        const init = json({
          email: 'not-registered@example.com',
          name: 'Rate Limit',
          password: 'limit-test-password-123',
        })
        const headers = new Headers(init.headers)
        headers.set('x-forwarded-for', `198.51.100.${attempt}`)
        headers.set('x-lidcode-peer-ip', `198.51.100.${attempt}`)
        results.push(await fixture.request(path, { ...init, headers }))
      }
      assert.ok(
        results
          .slice(0, 3)
          .every((response) => response.status === (path.endsWith('/sign-in/email') ? 401 : 200)),
      )
      assert.equal(results[3]?.status, 429)
      assert.ok(results[3]?.headers.get('retry-after') ?? results[3]?.headers.get('x-retry-after'))
    }
    assert.ok((await first.store.database.query.rateLimit.findMany()).length > 0)
  } finally {
    await second.close()
    await first.close()
  }
})
