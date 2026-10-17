import assert from 'node:assert/strict'
import { test } from 'node:test'
import { eq } from 'drizzle-orm'
import { verification } from './infra/adapters/drizzle/schemas/auth.js'
import { createHttpFixture, json } from './test/http.js'
import { createBrowser, registerUser } from './test/oauth.js'
import { mockSocialProviders, socialEnvironment } from './test/social.js'

test('password recovery gives equal public responses, consumes its email proof, and preserves identity', async () => {
  const fixture = await createHttpFixture()
  try {
    const { user } = await registerUser(fixture)
    const recovery = await fixture.request(
      '/api/auth/request-password-reset',
      json({ email: user.email, redirectTo: '/reset-password' }),
    )
    const unknown = await fixture.request(
      '/api/auth/request-password-reset',
      json({ email: 'unregistered@example.com', redirectTo: '/reset-password' }),
    )
    assert.equal(recovery.status, 200)
    assert.equal(unknown.status, 200)
    assert.deepEqual(await recovery.json(), await unknown.json())
    const email = fixture.emails.filter((message) => message.kind === 'password-reset').at(-1)
    assert.ok(email)
    const link = await fixture.request(email.url)
    assert.equal(link.status, 302)
    const redirect = link.headers.get('location')
    assert.ok(redirect)
    const token = new URL(redirect, fixture.env.AUTH_PUBLIC_ORIGIN).searchParams.get('token')
    assert.ok(token)
    const body = { token, newPassword: 'recovered-password-123' }
    assert.equal((await fixture.request('/api/auth/reset-password', json(body))).status, 200)
    assert.equal((await fixture.request('/api/auth/reset-password', json(body))).status, 400)
    const browser = createBrowser(fixture)
    assert.equal(
      (
        await browser.request(
          '/api/auth/sign-in/email',
          json({ email: user.email, password: body.newPassword }),
        )
      ).status,
      200,
    )
    assert.equal((await (await browser.request('/api/auth/get-session')).json()).user.id, user.id)
  } finally {
    await fixture.close()
  }
})

test('expired recovery links cannot change the existing password', async () => {
  const fixture = await createHttpFixture()
  try {
    const { user } = await registerUser(fixture)
    await fixture.request(
      '/api/auth/request-password-reset',
      json({ email: user.email, redirectTo: '/reset-password' }),
    )
    const email = fixture.emails.filter((message) => message.kind === 'password-reset').at(-1)
    assert.ok(email)
    const token = new URL(email.url).pathname.split('/').at(-1)
    assert.ok(token)
    await fixture.store.database
      .update(verification)
      .set({ expiresAt: new Date(0) })
      .where(eq(verification.identifier, `reset-password:${token}`))
    assert.equal(
      (
        await fixture.request(
          '/api/auth/reset-password',
          json({ token, newPassword: 'must-not-be-set-123' }),
        )
      ).status,
      400,
    )
    assert.equal(
      (
        await fixture.request(
          '/api/auth/sign-in/email',
          json({ email: user.email, password: 'test-only-password-123' }),
        )
      ).status,
      200,
    )
  } finally {
    await fixture.close()
  }
})

test('authenticated password changes require the current password and retain the same user', async () => {
  const fixture = await createHttpFixture()
  try {
    const { browser, user } = await registerUser(fixture)
    const incorrect = await browser.request(
      '/api/auth/change-password',
      json({ currentPassword: 'wrong-password', newPassword: 'new-password-123' }),
    )
    assert.ok(incorrect.status >= 400)
    const changed = await browser.request(
      '/api/auth/change-password',
      json({ currentPassword: 'test-only-password-123', newPassword: 'new-password-123' }),
    )
    assert.equal(changed.status, 200)
    assert.equal(
      (
        await fixture.request(
          '/api/auth/sign-in/email',
          json({ email: user.email, password: 'test-only-password-123' }),
        )
      ).status,
      401,
    )
    const login = createBrowser(fixture)
    assert.equal(
      (
        await login.request(
          '/api/auth/sign-in/email',
          json({ email: user.email, password: 'new-password-123' }),
        )
      ).status,
      200,
    )
    assert.equal((await (await login.request('/api/auth/get-session')).json()).user.id, user.id)
  } finally {
    await fixture.close()
  }
})

test('social-only users establish a password through email proof rather than browser set-password', async (context) => {
  const social = await mockSocialProviders(context)
  const fixture = await createHttpFixture({ environment: socialEnvironment })
  try {
    const browser = createBrowser(fixture)
    await social.complete(browser, 'google', {
      id: 'social-password-subject',
      email: 'social@example.com',
      verified: true,
    })
    const before = await (await browser.request('/api/auth/get-session')).json()
    assert.equal(
      (
        await browser.request(
          '/api/auth/set-password',
          json({ newPassword: 'bypass-password-123' }),
        )
      ).status,
      404,
    )
    await browser.request(
      '/api/auth/request-password-reset',
      json({ email: before.user.email, redirectTo: '/reset-password' }),
    )
    const email = fixture.emails.filter((message) => message.kind === 'password-reset').at(-1)
    assert.ok(email)
    const link = await fixture.request(email.url)
    const location = link.headers.get('location')
    assert.ok(location)
    const token = new URL(location, fixture.env.AUTH_PUBLIC_ORIGIN).searchParams.get('token')
    assert.ok(token)
    assert.equal(
      (
        await fixture.request(
          '/api/auth/reset-password',
          json({ token, newPassword: 'established-password-123' }),
        )
      ).status,
      200,
    )
    const passwordBrowser = createBrowser(fixture)
    assert.equal(
      (
        await passwordBrowser.request(
          '/api/auth/sign-in/email',
          json({ email: before.user.email, password: 'established-password-123' }),
        )
      ).status,
      200,
    )
    assert.equal(
      (await (await passwordBrowser.request('/api/auth/get-session')).json()).user.id,
      before.user.id,
    )
    const methods = await (await passwordBrowser.request('/api/v1/me/sign-in-methods')).json()
    assert.equal(methods.methods.length, 2)
    assert.ok(methods.methods.every((method: { usable: boolean }) => method.usable))
  } finally {
    await fixture.close()
  }
})
