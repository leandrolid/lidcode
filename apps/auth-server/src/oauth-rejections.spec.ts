import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture } from './test/http.js'
import {
  approveCode,
  authorizationQuery,
  createTestClients,
  exchangeCode,
  registerUser,
  tokenRequest,
} from './test/oauth.js'

async function assertRejected(response: Response) {
  const data = response.headers.get('location')
    ? { url: response.headers.get('location') }
    : await response.json()
  assert.ok(!data.access_token && !data.refresh_token && !data.id_token && !data.code)
  if (data.url) {
    const target = new URL(data.url, 'http://localhost:3001')
    assert.ok(!target.searchParams.has('code'))
    assert.ok(target.searchParams.has('error'), target.href)
  } else {
    assert.ok(response.status >= 400)
    assert.ok(data.error)
  }
}

test('code exchange rejects wrong/missing PKCE, invalid client authentication, and replay', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha, beta } = await createTestClients(fixture)
    const { browser } = await registerUser(fixture)
    for (const verifier of ['incorrect-verifier'.repeat(3), undefined]) {
      const authorization = await approveCode(browser, alpha)
      await assertRejected(
        await tokenRequest(fixture, alpha, {
          grant_type: 'authorization_code',
          code: authorization.code,
          redirect_uri: alpha.redirect_uris[0] ?? '',
          ...(verifier ? { code_verifier: verifier } : {}),
        }),
      )
    }

    for (const client of [
      { ...alpha, client_secret: 'wrong-secret' },
      { ...alpha, client_id: 'unknown-client' },
      beta,
    ]) {
      const pending = await approveCode(browser, alpha)
      await assertRejected(
        await tokenRequest(fixture, client, {
          grant_type: 'authorization_code',
          code: pending.code,
          redirect_uri: alpha.redirect_uris[0] ?? '',
          code_verifier: pending.verifier,
        }),
      )
    }
    const authorization = await approveCode(browser, alpha)
    const fields = {
      grant_type: 'authorization_code',
      code: authorization.code,
      redirect_uri: alpha.redirect_uris[0] ?? '',
      code_verifier: authorization.verifier,
    }
    const tokens = await exchangeCode(fixture, alpha, authorization)
    assert.ok(tokens.access_token)
    await assertRejected(await tokenRequest(fixture, alpha, fields))

    const another = await approveCode(browser, alpha)
    const postAuthentication = await fixture.request('/api/auth/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        ...fields,
        code: another.code,
        code_verifier: another.verifier,
        client_id: alpha.client_id,
        client_secret: alpha.client_secret,
      }),
    })
    await assertRejected(postAuthentication)
  } finally {
    await fixture.close()
  }
})

test('authorization rejects missing/plain PKCE, unknown clients, redirects, and disallowed scopes', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha, operator } = await createTestClients(fixture)
    const { browser } = await registerUser(fixture)
    const base = authorizationQuery(alpha).query
    const missingPkce = new URLSearchParams(base)
    missingPkce.delete('code_challenge')
    missingPkce.delete('code_challenge_method')
    const invalidQueries = [
      missingPkce,
      new URLSearchParams({ ...Object.fromEntries(base), code_challenge_method: 'plain' }),
      new URLSearchParams({ ...Object.fromEntries(base), client_id: 'unknown-client' }),
      new URLSearchParams({
        ...Object.fromEntries(base),
        redirect_uri: 'https://evil.example/callback',
      }),
      new URLSearchParams({
        ...Object.fromEntries(base),
        redirect_uri: `${alpha.redirect_uris[0]}?extra=true`,
      }),
      new URLSearchParams({ ...Object.fromEntries(base), scope: 'openid forbidden' }),
    ]
    for (const query of invalidQueries) {
      await assertRejected(await browser.request(`/api/auth/oauth2/authorize?${query}`))
    }
    await fixture.auth.api.adminUpdateOAuthClient({
      headers: new Headers({ cookie: operator.browser.cookie }),
      body: { client_id: alpha.client_id, update: { scope: 'openid profile' } },
    })
    await assertRejected(await browser.request(`/api/auth/oauth2/authorize?${base}`))
  } finally {
    await fixture.close()
  }
})

test('disabling a client prevents authorization and pending-code exchange', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha, operator } = await createTestClients(fixture)
    const { browser } = await registerUser(fixture)
    const pending = await approveCode(browser, alpha)
    await fixture.auth.api.adminUpdateOAuthClient({
      headers: new Headers({ cookie: operator.browser.cookie }),
      body: { client_id: alpha.client_id, update: { disabled: true } },
    })
    await assertRejected(
      await browser.request(`/api/auth/oauth2/authorize?${authorizationQuery(alpha).query}`),
    )
    await assertRejected(
      await tokenRequest(fixture, alpha, {
        grant_type: 'authorization_code',
        code: pending.code,
        code_verifier: pending.verifier,
        redirect_uri: alpha.redirect_uris[0] ?? '',
        resource: alpha.resource,
      }),
    )
  } finally {
    await fixture.close()
  }
})
