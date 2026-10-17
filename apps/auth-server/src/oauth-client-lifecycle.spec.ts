import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture, json } from './test/http.js'
import {
  approveCode,
  authorizationQuery,
  createTestClients,
  exchangeCode,
  introspect,
  registerUser,
  responseRedirect,
  tokenRequest,
  userInfo,
} from './test/oauth.js'

test('client disable/re-enable and one-time secret rotation enforce every issuance and validation boundary', async (context) => {
  const logs: unknown[][] = []
  for (const method of ['log', 'warn', 'error'] as const)
    context.mock.method(console, method, (...values: unknown[]) => {
      logs.push(values)
    })
  const fixture = await createHttpFixture()
  try {
    const { alpha, beta, operator } = await createTestClients(fixture)
    const { browser } = await registerUser(fixture)
    const tokens = await exchangeCode(fixture, alpha, await approveCode(browser, alpha))
    const betaTokens = await exchangeCode(fixture, beta, await approveCode(browser, beta))
    const pending = await approveCode(browser, alpha)
    const disabled = await operator.browser.request(
      `/api/v1/admin/oauth-clients/${alpha.client_id}/status`,
      {
        ...json({ enabled: false }),
        method: 'PATCH',
      },
    )
    assert.equal(disabled.status, 200)
    assert.equal((await disabled.json()).client.disabled, true)
    const authorize = await browser.request(
      `/api/auth/oauth2/authorize?${authorizationQuery(alpha).query}`,
    )
    assert.ok(!JSON.stringify(await authorize.json()).includes('code='))
    assert.notEqual(
      (await (await introspect(fixture, alpha, tokens.access_token)).json()).active,
      true,
    )
    assert.ok((await userInfo(fixture, tokens.access_token)).status >= 400)
    assert.ok(tokens.refresh_token)
    for (const fields of [
      {
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        resource: alpha.resource,
      },
      {
        grant_type: 'authorization_code',
        code: pending.code,
        code_verifier: pending.verifier,
        redirect_uri: alpha.redirect_uris[0] ?? '',
        resource: alpha.resource,
      },
    ] as Record<string, string>[]) {
      assert.ok((await tokenRequest(fixture, alpha, fields)).status >= 400)
    }
    assert.equal(
      (await browser.request(`/api/v1/authorized-apps/${alpha.client_id}`, { method: 'DELETE' }))
        .status,
      200,
    )
    assert.equal(
      (
        await operator.browser.request(`/api/v1/admin/oauth-clients/${alpha.client_id}/status`, {
          ...json({ enabled: true }),
          method: 'PATCH',
        })
      ).status,
      200,
    )
    assert.equal(
      (await (await introspect(fixture, alpha, tokens.access_token)).json()).active,
      false,
    )
    const reconnect = await responseRedirect(
      await browser.request(`/api/auth/oauth2/authorize?${authorizationQuery(alpha).query}`),
    )
    assert.equal(reconnect.pathname, '/consent')
    const fresh = await exchangeCode(fixture, alpha, await approveCode(browser, alpha))
    assert.ok(fresh.refresh_token)
    const rotation = await operator.browser.request(
      `/api/v1/admin/oauth-clients/${alpha.client_id}/rotate-secret`,
      { method: 'POST' },
    )
    assert.equal(rotation.status, 200)
    const rotated = await rotation.json()
    assert.ok(rotated.clientSecret)
    assert.notEqual(rotated.clientSecret, alpha.client_secret)
    const currentClient = { ...alpha, client_secret: rotated.clientSecret }
    assert.equal((await introspect(fixture, alpha, fresh.access_token)).status, 401)
    assert.equal(
      (await (await introspect(fixture, currentClient, fresh.access_token)).json()).active,
      true,
    )
    const oldRenewal = await tokenRequest(fixture, alpha, {
      grant_type: 'refresh_token',
      refresh_token: fresh.refresh_token,
      resource: alpha.resource,
    })
    assert.equal(oldRenewal.status, 401)
    const nextCode = await approveCode(browser, currentClient)
    const oldExchange = await tokenRequest(fixture, alpha, {
      grant_type: 'authorization_code',
      code: nextCode.code,
      code_verifier: nextCode.verifier,
      redirect_uri: alpha.redirect_uris[0] ?? '',
      resource: alpha.resource,
    })
    assert.equal(oldExchange.status, 401)
    assert.ok((await exchangeCode(fixture, currentClient, nextCode)).access_token)
    assert.equal(
      (await (await introspect(fixture, beta, betaTokens.access_token)).json()).active,
      true,
    )
    const listing = await (await operator.browser.request('/api/v1/admin/oauth-clients')).json()
    for (const secret of [alpha.client_secret, rotated.clientSecret]) {
      assert.ok(!JSON.stringify(listing).includes(secret))
      assert.ok(!JSON.stringify(logs).includes(secret))
    }
    assert.ok(!JSON.stringify(listing).includes('clientSecret'))
  } finally {
    await fixture.close()
  }
})
