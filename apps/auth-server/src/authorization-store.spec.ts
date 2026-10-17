import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appAuthorizations, authorizationBindings } from './infra/adapters/drizzle/schemas/index.js'
import {
  createAuthorizationStore,
  credentialDigest,
} from './infra/repositories/authorization-store.js'
import { createHttpFixture } from './test/http.js'
import { createTestClients, registerUser } from './test/oauth.js'

test('active approvals are unique; credentials retain immutable lifecycle digests and expiry', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const { user } = await registerUser(fixture)
    const store = createAuthorizationStore(fixture.store.database)
    const first = await store.approve(user.id, alpha.client_id, ['openid'], new Date())
    await assert.rejects(
      fixture.store.database.insert(appAuthorizations).values({
        userId: user.id,
        clientId: alpha.client_id,
        scopes: ['openid'],
      }),
    )
    const raw = 'a-raw-access-credential-that-must-not-be-stored'
    await store.bind(first.id, [
      { kind: 'access', digest: credentialDigest(raw), expiresAt: new Date(Date.now() + 60_000) },
      {
        kind: 'code',
        digest: credentialDigest('already-expired'),
        expiresAt: new Date(Date.now() - 1000),
      },
    ])
    assert.equal((await store.resolve('access', raw))?.authorization.id, first.id)
    assert.equal(await store.resolve('code', 'already-expired'), null)
    assert.equal(await store.resolve('access', 'unknown'), null)
    assert.equal(await store.resolve('refresh', raw), null)
    const persisted = await fixture.store.database.select().from(authorizationBindings)
    assert.ok(!JSON.stringify(persisted).includes(raw))
    assert.match(persisted[0]?.digest ?? '', /^[a-f0-9]{64}$/)
    const expanded = await store.approve(user.id, alpha.client_id, ['profile'], new Date())
    assert.equal(expanded.id, first.id)
    assert.deepEqual(expanded.scopes, ['openid', 'profile'])
    await store.revoke(user.id, alpha.client_id)
    await store.revoke(user.id, alpha.client_id)
    assert.equal(await store.resolve('access', raw), null)
    assert.equal(await store.active(user.id, alpha.client_id), null)
    await assert.rejects(store.approve(user.id, alpha.client_id, ['openid'], first.approvedAt))
    const second = await store.approve(user.id, alpha.client_id, ['openid'], new Date())
    assert.notEqual(second.id, first.id)
    assert.equal(await store.resolve('access', raw), null)
    await assert.rejects(
      store.bind(second.id, [
        { kind: 'access', digest: credentialDigest(raw), expiresAt: new Date(Date.now() + 60_000) },
      ]),
    )
    assert.equal((await fixture.store.database.select().from(appAuthorizations)).length, 2)
  } finally {
    await fixture.close()
  }
})
