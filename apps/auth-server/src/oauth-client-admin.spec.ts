import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bootstrapAdministrator } from './application/usecases/bootstrap-administrator.js'
import { createHttpFixture, json } from './test/http.js'
import {
  approveCode,
  authorizationQuery,
  exchangeCode,
  registerUser,
  responseRedirect,
} from './test/oauth.js'

test('administrators create/update a confidential, resource-bound client with fixed PKCE and consent', async () => {
  const fixture = await createHttpFixture()
  try {
    const { browser, user } = await registerUser(fixture)
    await bootstrapAdministrator(fixture.store.database, user.email)
    const configuration = {
      name: 'Managed App',
      redirectUris: ['https://managed.example.com/callback'],
      scopes: ['openid', 'profile'],
    }
    const response = await browser.request('/api/v1/admin/oauth-clients', json(configuration))
    assert.equal(response.status, 201, await response.clone().text())
    const created = await response.json()
    assert.ok(created.clientSecret)
    assert.equal(created.client.tokenEndpointAuthMethod, 'client_secret_basic')
    assert.deepEqual(created.client.grantTypes, ['authorization_code', 'refresh_token'])
    assert.equal(created.client.requirePKCE, true)
    assert.equal(created.client.skipConsent, false)
    assert.ok(created.client.resource.startsWith(`${fixture.env.issuer}/resources/`))
    const protocolClient = {
      client_id: created.client.clientId,
      client_secret: created.clientSecret,
      redirect_uris: created.client.redirectUris,
      resource: created.client.resource,
    }
    const tokens = await exchangeCode(
      fixture,
      protocolClient,
      await approveCode(browser, protocolClient, 'openid profile'),
    )
    assert.ok(tokens.access_token)
    const change = await browser.request(`/api/v1/admin/oauth-clients/${created.client.clientId}`, {
      ...json({ name: 'Renamed App', scopes: ['openid', 'profile', 'email'] }),
      method: 'PATCH',
    })
    assert.equal(change.status, 200, await change.clone().text())
    assert.equal((await change.json()).client.name, 'Renamed App')
    assert.deepEqual((await fixture.store.database.query.appAuthorizations.findFirst())?.scopes, [
      'openid',
      'profile',
    ])
    const expanded = authorizationQuery(protocolClient, { scope: 'openid profile email' })
    const consent = await responseRedirect(
      await browser.request(`/api/auth/oauth2/authorize?${expanded.query}`),
    )
    assert.equal(consent.pathname, '/consent')
    const anotherAdmin = await registerUser(fixture, 'another-admin@example.com')
    await bootstrapAdministrator(fixture.store.database, anotherAdmin.user.email)
    const administrativeUpdate = await anotherAdmin.browser.request(
      `/api/v1/admin/oauth-clients/${created.client.clientId}`,
      {
        ...json({ name: 'Shared Administrator Registry' }),
        method: 'PATCH',
      },
    )
    assert.equal(administrativeUpdate.status, 200)
    const listing = await (await browser.request('/api/v1/admin/oauth-clients')).json()
    assert.equal(listing.clients.length, 1)
    assert.ok(!JSON.stringify(listing).includes(created.clientSecret))
    assert.ok(!JSON.stringify(listing).includes('clientSecret'))
    const local = await browser.request(
      '/api/v1/admin/oauth-clients',
      json({
        ...configuration,
        name: 'Local App',
        redirectUris: ['http://127.0.0.1:8765/callback'],
      }),
    )
    assert.equal(local.status, 201, await local.clone().text())
  } finally {
    await fixture.close()
  }
})

test('client configuration rejects unsafe redirects, consent bypass, ownership, and unsupported metadata', async () => {
  const fixture = await createHttpFixture()
  try {
    const { browser, user } = await registerUser(fixture)
    await bootstrapAdministrator(fixture.store.database, user.email)
    const configuration = {
      name: 'App',
      redirectUris: ['https://client.example/callback'],
      scopes: ['openid'],
    }
    for (const redirect of [
      'https://*.example.com/callback',
      'http://public.example/callback',
      'not-a-uri',
      'https://user:password@example.com/callback',
      'https://example.com/callback#fragment',
      'http://127.1/callback',
    ]) {
      assert.equal(
        (
          await browser.request(
            '/api/v1/admin/oauth-clients',
            json({ ...configuration, redirectUris: [redirect] }),
          )
        ).status,
        400,
      )
    }
    for (const extra of [
      { skip_consent: true },
      { skipConsent: true },
      { userId: 'another-user' },
      { reference_id: 'external-owner' },
      { grant_types: ['client_credentials'] },
      { token_endpoint_auth_method: 'none' },
      { metadata: { any: true } },
      { scopes: ['openid', 'arbitrary-scope'] },
    ]) {
      assert.equal(
        (await browser.request('/api/v1/admin/oauth-clients', json({ ...configuration, ...extra })))
          .status,
        400,
      )
    }
    assert.equal((await fixture.store.database.query.oauthClient.findMany()).length, 0)
  } finally {
    await fixture.close()
  }
})
