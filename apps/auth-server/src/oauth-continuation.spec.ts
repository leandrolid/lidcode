import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture, json } from './test/http.js'
import { authorizationQuery, createTestClients, registerUser, responseRedirect } from './test/oauth.js'

test('consent metadata requires a native signed continuation, current client policy, and a verified session', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const { browser } = await registerUser(fixture)
    const query = authorizationQuery(alpha).query
    const consent = await responseRedirect(await browser.request(`/api/auth/oauth2/authorize?${query}`))
    const valid = { oauthQuery: consent.search.slice(1) }
    assert.equal((await fixture.request('/api/v1/oauth/continuation', json(valid))).status, 401)
    const metadata = await browser.request('/api/v1/oauth/continuation', json(valid))
    assert.equal(metadata.status, 200)
    assert.deepEqual(await metadata.json(), { client: { id: alpha.client_id, name: 'Test alpha' }, scopes: ['openid', 'profile', 'email', 'offline_access'] })
    for (const tampered of [
      valid.oauthQuery.replace('scope=openid', 'scope=forbidden'),
      valid.oauthQuery.replace(encodeURIComponent(alpha.redirect_uris[0] ?? ''), encodeURIComponent('https://evil.example/callback')),
      query.toString(),
    ]) {
      assert.equal((await browser.request('/api/v1/oauth/continuation', json({ oauthQuery: tampered }))).status, 400)
    }
    assert.equal((await browser.request('/api/v1/oauth/continuation', json({ ...valid, returnTo: 'https://evil.example' }))).status, 400)
  } finally { await fixture.close() }
})
