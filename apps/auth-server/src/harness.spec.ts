import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture } from './test/http.js'
import { createTestClients } from './test/oauth.js'

test('real migrated HTTP fixtures isolate two confidential clients and database teardown', async () => {
  const first = await createHttpFixture()
  const second = await createHttpFixture()
  try {
    const { alpha, beta } = await createTestClients(first)
    assert.notEqual(alpha.client_id, beta.client_id)
    assert.notEqual(alpha.client_secret, beta.client_secret)
    for (const client of [alpha, beta]) {
      assert.equal(client.token_endpoint_auth_method, 'client_secret_basic')
      assert.deepEqual(client.grant_types, ['authorization_code', 'refresh_token'])
      assert.deepEqual(client.resources, [client.resource])
      assert.equal(client.require_pkce, true)
      assert.equal(client.skip_consent, false)
    }
    assert.equal((await first.store.database.query.oauthClient.findMany()).length, 2)
    assert.equal((await second.store.database.query.oauthClient.findMany()).length, 0)
    await first.close()
    assert.equal((await second.request('/healthz')).status, 200)
    assert.equal((await second.store.database.query.user.findMany()).length, 0)
  } finally {
    await first.close()
    await second.close()
  }
})
