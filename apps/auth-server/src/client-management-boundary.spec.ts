import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture, json } from './test/http.js'
import { authorizationQuery, createBrowser, createTestClients, registerUser } from './test/oauth.js'

test('all native private client management is blocked while consent metadata stays safe', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha, operator } = await createTestClients(fixture)
    const ordinary = await registerUser(fixture)
    const anonymous = createBrowser(fixture)
    for (const browser of [anonymous, ordinary.browser, operator.browser]) {
      for (const path of ['/oauth2/get-client', '/oauth2/get-clients']) {
        assert.equal(
          (await browser.request(`/api/auth${path}?client_id=${alpha.client_id}`)).status,
          404,
        )
      }
      for (const path of [
        '/oauth2/register',
        '/oauth2/create-client',
        '/oauth2/update-client',
        '/oauth2/delete-client',
        '/oauth2/client/rotate-secret',
        '/oauth2/client/rotate-keys',
        '/admin/oauth2/create-client',
        '/admin/oauth2/update-client',
        '/admin/oauth2/resources',
      ]) {
        const response = await browser.request(
          `/api/auth${path}`,
          json({
            client_id: alpha.client_id,
            client_name: 'Bypass',
            redirect_uris: ['https://evil.example/callback'],
            update: { skip_consent: true },
          }),
        )
        assert.equal(response.status, 404, path)
      }
    }
    const metadata = await ordinary.browser.request(
      `/api/auth/oauth2/public-client?client_id=${alpha.client_id}`,
    )
    assert.equal(metadata.status, 200)
    const publicClient = await metadata.json()
    assert.ok(publicClient.client_name || publicClient.name)
    const serialized = JSON.stringify(publicClient)
    assert.ok(!serialized.includes(alpha.client_secret))
    assert.ok(!serialized.includes('client_secret'))
    assert.ok(!serialized.includes('clientSecret'))
    assert.equal((await fixture.store.database.query.oauthClient.findMany()).length, 2)
  } finally {
    await fixture.close()
  }
})

test('external discovery is absent and cross-origin administrator mutations are rejected', async (context) => {
  const nativeFetch = globalThis.fetch
  const external: string[] = []
  context.mock.method(globalThis, 'fetch', (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(input instanceof Request ? input.url : input.toString())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      external.push(url.href)
      throw new Error('External client discovery must not run')
    }
    return nativeFetch(input, init)
  })
  const fixture = await createHttpFixture()
  try {
    const { alpha, operator } = await createTestClients(fixture)
    const query = authorizationQuery(alpha, {
      client_id: 'https://external.example/oauth-client.json',
    }).query
    const unknown = await fixture.request(`/api/auth/oauth2/authorize?${query}`)
    assert.ok(!JSON.stringify(await unknown.json()).includes('code='))
    assert.deepEqual(external, [])
    for (const [path, method, body] of [
      [
        '/api/v1/admin/oauth-clients',
        'POST',
        {
          name: 'Cross-origin',
          redirectUris: ['https://evil.example/callback'],
          scopes: ['openid'],
        },
      ],
      [`/api/v1/admin/oauth-clients/${alpha.client_id}`, 'PATCH', { name: 'Cross-origin' }],
      [`/api/v1/admin/oauth-clients/${alpha.client_id}/status`, 'PATCH', { enabled: false }],
      [`/api/v1/admin/oauth-clients/${alpha.client_id}/rotate-secret`, 'POST', undefined],
    ] as const) {
      const response = await fetch(`${fixture.origin}${path}`, {
        method,
        body: body ? JSON.stringify(body) : undefined,
        headers: {
          origin: 'https://evil.example',
          cookie: operator.browser.cookie,
          'content-type': 'application/json',
          'sec-fetch-site': 'cross-site',
        },
      })
      assert.equal(response.status, 403)
    }
    assert.equal((await fixture.store.database.query.oauthClient.findMany()).length, 2)
    const unchanged = await fixture.store.database.query.oauthClient.findFirst()
    assert.equal(unchanged?.disabled, false)
    assert.notEqual(unchanged?.name, 'Cross-origin')
  } finally {
    await fixture.close()
  }
})
