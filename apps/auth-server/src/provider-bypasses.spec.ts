import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture, json } from './test/http.js'
import {
  approveCode,
  createTestClients,
  exchangeCode,
  introspect,
  registerUser,
} from './test/oauth.js'

test('native consent management cannot bypass explicit approval or the authoritative revoke operation', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const { browser } = await registerUser(fixture)
    const tokens = await exchangeCode(
      fixture,
      alpha,
      await approveCode(browser, alpha, 'openid profile'),
    )
    const consent = await fixture.store.database.query.oauthConsent.findFirst()
    assert.ok(consent)
    for (const path of ['/api/auth/oauth2/update-consent', '/api/auth/oauth2/delete-consent']) {
      for (const variant of [path, `${path}/`, path.replace('oauth2', '%6fauth2')]) {
        const response = await browser.request(
          variant,
          json({ id: consent.id, update: { scopes: ['openid', 'profile', 'email'] } }),
        )
        assert.ok(response.status >= 400)
      }
    }
    const unchanged = await fixture.store.database.query.oauthConsent.findFirst()
    assert.deepEqual(unchanged?.scopes, ['openid', 'profile'])
    assert.equal(
      (await (await introspect(fixture, alpha, tokens.access_token)).json()).active,
      true,
    )
    assert.equal(
      (await browser.request(`/api/v1/authorized-apps/${alpha.client_id}`, { method: 'DELETE' }))
        .status,
      200,
    )
    assert.equal((await fixture.store.database.query.oauthConsent.findMany()).length, 0)
    const validation = await fixture.request('/api/auth/oauth2/introspect/', {
      method: 'POST',
      headers: {
        authorization: `Basic ${Buffer.from(`${alpha.client_id}:${alpha.client_secret}`).toString('base64')}`,
      },
      body: new URLSearchParams({ token: tokens.access_token }),
    })
    if (validation.ok) assert.notEqual((await validation.json()).active, true)
    else assert.ok(validation.status >= 400)
    const info = await fixture.request('/api/auth/oauth2/userinfo/', {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    })
    assert.ok(info.status >= 400)
  } finally {
    await fixture.close()
  }
})

test('a central cookie cannot mint a generic session JWT or substitute for delegated client authentication', async () => {
  const fixture = await createHttpFixture()
  try {
    const { browser } = await registerUser(fixture)
    for (const path of ['/api/auth/token', '/api/auth/token/', '/api/auth/%74oken']) {
      for (const init of [undefined, json({})]) {
        const response = await browser.request(path, init)
        assert.ok(response.status >= 400)
        const body = await response.json()
        assert.ok(!body.token && !body.access_token && !body.id_token)
      }
    }
    const response = await browser.request('/api/auth/oauth2/introspect', {
      method: 'POST',
      body: new URLSearchParams({ token: browser.cookie }),
    })
    assert.equal(response.status, 401)
    assert.notEqual((await response.json()).active, true)
  } finally {
    await fixture.close()
  }
})
