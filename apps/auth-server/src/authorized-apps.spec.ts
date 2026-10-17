import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture, json } from './test/http.js'
import {
  approveCode,
  createBrowser,
  createTestClients,
  exchangeCode,
  introspect,
  registerUser,
  tokenRequest,
  userInfo,
} from './test/oauth.js'

test('authorized-app revoke cuts off all sessions for one app without affecting other relationships', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha, beta } = await createTestClients(fixture)
    const first = await registerUser(fixture)
    const second = createBrowser(fixture)
    assert.equal(
      (
        await second.request(
          '/api/auth/sign-in/email',
          json({
            email: first.user.email,
            password: 'test-only-password-123',
          }),
        )
      ).status,
      200,
    )
    const other = await registerUser(fixture, 'other@example.com')
    const empty = await other.browser.request('/api/v1/authorized-apps')
    assert.deepEqual(await empty.json(), { apps: [] })
    const alphaFirst = await exchangeCode(fixture, alpha, await approveCode(first.browser, alpha))
    const alphaSecond = await exchangeCode(fixture, alpha, await approveCode(second, alpha))
    const betaTokens = await exchangeCode(fixture, beta, await approveCode(first.browser, beta))
    const otherTokens = await exchangeCode(fixture, alpha, await approveCode(other.browser, alpha))
    const listing = await (await first.browser.request('/api/v1/authorized-apps')).json()
    assert.equal(listing.apps.length, 2)
    assert.ok(
      listing.apps.every(
        (app: { clientId: string; approvedAt: string; scopes: string[] }) =>
          [alpha.client_id, beta.client_id].includes(app.clientId) &&
          app.approvedAt &&
          app.scopes.includes('openid'),
      ),
    )
    assert.ok(!JSON.stringify(listing).includes(alpha.client_secret))
    assert.equal((await fixture.request('/api/v1/authorized-apps')).status, 401)
    const attack = await other.browser.request(`/api/v1/authorized-apps/${beta.client_id}`, {
      method: 'DELETE',
    })
    assert.equal(attack.status, 404)
    for (let count = 0; count < 2; count++) {
      const revoke = await first.browser.request(`/api/v1/authorized-apps/${alpha.client_id}`, {
        method: 'DELETE',
      })
      assert.equal(revoke.status, 200)
    }
    for (const tokens of [alphaFirst, alphaSecond]) {
      assert.equal(
        (await (await introspect(fixture, alpha, tokens.access_token)).json()).active,
        false,
      )
      assert.equal((await userInfo(fixture, tokens.access_token)).status, 401)
      assert.ok(tokens.refresh_token)
      const renewal = await tokenRequest(fixture, alpha, {
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        resource: alpha.resource,
      })
      assert.ok(renewal.status >= 400)
      assert.ok(!(await renewal.json()).access_token)
    }
    assert.equal(
      (await (await introspect(fixture, beta, betaTokens.access_token)).json()).active,
      true,
    )
    assert.equal(
      (await (await introspect(fixture, alpha, otherTokens.access_token)).json()).active,
      true,
    )
    assert.equal(
      (await (await first.browser.request('/api/auth/get-session')).json()).user.id,
      first.user.id,
    )
    const remaining = await (await first.browser.request('/api/v1/authorized-apps')).json()
    assert.equal(remaining.apps.length, 1)
    assert.equal(remaining.apps[0].clientId, beta.client_id)
  } finally {
    await fixture.close()
  }
})
