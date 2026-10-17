import assert from 'node:assert/strict'
import { test } from 'node:test'
import { eq } from 'drizzle-orm'
import { verification } from './infra/adapters/drizzle/schemas/auth.js'
import { credentialDigest } from './infra/repositories/authorization-store.js'
import { cookies, createHttpFixture, json } from './test/http.js'
import { createBrowser } from './test/oauth.js'

test('signup, resend, verification, and password login require a valid single-use email proof', async () => {
  const fixture = await createHttpFixture()
  try {
    const browser = createBrowser(fixture)
    const account = {
      name: 'Verified User',
      email: 'verified@example.com',
      password: 'account-test-password-123',
    }
    const signup = await browser.request(
      '/api/auth/sign-up/email',
      json({ ...account, callbackURL: '/profile' }),
    )
    assert.equal(signup.status, 200)
    assert.ok(!cookies(signup).includes('session_token='))
    assert.equal((await browser.request('/api/v1/authorized-apps')).status, 401)
    assert.equal((await browser.request('/api/auth/sign-in/email', json(account))).status, 403)
    const resend = await browser.request(
      '/api/auth/send-verification-email',
      json({ email: account.email, callbackURL: '/profile' }),
    )
    assert.equal(resend.status, 200)
    const email = fixture.emails.at(-1)
    assert.ok(email && email.kind === 'verification')
    const verified = await browser.request(email.url)
    assert.equal(verified.status, 302)
    assert.equal((await browser.request('/api/v1/authorized-apps')).status, 200)
    const replay = await fixture.request(email.url)
    assert.equal(replay.status, 400)
    assert.ok(!cookies(replay).includes('session_token='))
    const login = await fixture.request('/api/auth/sign-in/email', json(account))
    assert.equal(login.status, 200)
    assert.ok(cookies(login).includes('session_token='))
    const wrong = await fixture.request(
      '/api/auth/sign-in/email',
      json({ ...account, password: 'incorrect-password' }),
    )
    assert.equal(wrong.status, 401)
    assert.ok(!cookies(wrong).includes('session_token='))
  } finally {
    await fixture.close()
  }
})

test('expired verification proofs fail and simultaneous reuse succeeds at most once across instances', async () => {
  const fixture = await createHttpFixture()
  const remote = await createHttpFixture({ databaseUrl: fixture.store.url })
  try {
    await fixture.request(
      '/api/auth/sign-up/email',
      json({ name: 'Expired', email: 'expired@example.com', password: 'test-password-123' }),
    )
    const expired = fixture.emails.at(-1)
    assert.ok(expired)
    const token = new URL(expired.url).searchParams.get('token')
    assert.ok(token)
    await fixture.store.database
      .update(verification)
      .set({ expiresAt: new Date(0) })
      .where(eq(verification.identifier, `email-proof:${credentialDigest(token)}`))
    assert.equal((await fixture.request(expired.url)).status, 400)
    const unchanged = await fixture.store.database.query.user.findFirst()
    assert.equal(unchanged?.emailVerified, false)
    await fixture.request(
      '/api/auth/sign-up/email',
      json({ name: 'Concurrent', email: 'concurrent@example.com', password: 'test-password-123' }),
    )
    const email = fixture.emails.at(-1)
    assert.ok(email)
    const responses = await Promise.all([fixture.request(email.url), remote.request(email.url)])
    assert.equal(
      responses.filter((response) => response.status === 200 || response.status === 302).length,
      1,
    )
    assert.equal(responses.filter((response) => response.status === 400).length, 1)
  } finally {
    await remote.close()
    await fixture.close()
  }
})
