import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cookies, createHttpFixture, json } from './test/http.js'

test('native HTTP signup, verification redirect, repeated cookies, and session lookup', async () => {
  const fixture = await createHttpFixture()
  try {
    const account = {
      name: 'HTTP User',
      email: 'http@example.com',
      password: 'a-test-password-123',
    }
    const signup = await fixture.request(
      '/api/auth/sign-up/email',
      json({
        ...account,
        callbackURL: '/profile',
        role: 'admin',
      }),
    )
    assert.equal(signup.status, 200, await signup.clone().text())
    assert.ok(!cookies(signup).includes('session_token='))
    assert.equal(fixture.emails.length, 1)
    const email = fixture.emails[0]
    assert.ok(email)
    assert.equal(email.to, account.email)
    assert.equal(email.kind, 'verification')
    assert.ok(email.url.startsWith(`${fixture.env.issuer}/verify-email?`))

    const unverified = await fixture.request('/api/auth/sign-in/email', json(account))
    assert.equal(unverified.status, 403)
    assert.ok(!cookies(unverified).includes('session_token='))

    const verification = await fixture.request(email.url)
    assert.equal(verification.status, 302)
    const location = verification.headers.get('location')
    assert.ok(location)
    assert.equal(new URL(location, fixture.env.AUTH_PUBLIC_ORIGIN).pathname, '/profile')
    assert.ok(cookies(verification).includes('session_token='))

    const login = await fixture.request(
      '/api/auth/sign-in/email',
      json({
        ...account,
        rememberMe: false,
      }),
    )
    assert.equal(login.status, 200, await login.clone().text())
    const setCookies = login.headers.getSetCookie()
    assert.ok(
      setCookies.length >= 2,
      `Expected repeated Set-Cookie headers, got ${setCookies.length}`,
    )
    assert.ok(setCookies.some((cookie) => cookie.includes('session_token=')))
    assert.ok(setCookies.some((cookie) => cookie.includes('dont_remember=')))
    for (const cookie of setCookies) {
      assert.match(cookie, /HttpOnly/i)
      assert.match(cookie, /SameSite=Lax/i)
      assert.doesNotMatch(cookie, /Domain=/i)
    }
    const session = await fixture.request('/api/auth/get-session', {
      headers: { cookie: cookies(login) },
    })
    assert.equal(session.status, 200)
    const data = await session.json()
    assert.equal(data.user.email, account.email)
    assert.equal(data.user.emailVerified, true)
    assert.equal(data.user.role, 'user')
  } finally {
    await fixture.close()
  }
})

test('native token handler receives URL-encoded forms and discovery uses canonical issuer', async () => {
  let receivedBody: string | undefined
  const fixture = await createHttpFixture({
    async inspectRequest(request) {
      if (new URL(request.url).pathname === '/api/auth/oauth2/token') {
        receivedBody = await request.text()
      }
    },
  })
  try {
    const metadata = await fixture.request('/api/auth/.well-known/openid-configuration', {
      headers: { 'x-forwarded-host': 'untrusted.example', 'x-forwarded-proto': 'https' },
    })
    assert.equal(metadata.status, 200)
    assert.match(metadata.headers.get('content-type') ?? '', /application\/json/)
    const discovery = await metadata.json()
    assert.equal(discovery.issuer, fixture.env.issuer)
    assert.equal(discovery.token_endpoint, `${fixture.env.issuer}/oauth2/token`)

    const form = new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'test+code&with=escaped/characters',
      redirect_uri: 'https://client.example/callback?preserved=a+b&value=two',
      code_verifier: 'a'.repeat(43),
    })
    const token = await fixture.request('/api/auth/oauth2/token', {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from('unknown-client:unknown-secret').toString('base64')}`,
      },
      body: form,
    })
    assert.equal(token.status, 401, await token.clone().text())
    assert.equal(receivedBody, form.toString())
    assert.equal((await token.json()).error, 'invalid_client')
    assert.match(token.headers.get('www-authenticate') ?? '', /Basic/i)
  } finally {
    await fixture.close()
  }
})
