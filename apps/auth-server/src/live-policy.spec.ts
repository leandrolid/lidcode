import assert from 'node:assert/strict'
import { test } from 'node:test'
import { eq } from 'drizzle-orm'
import {
  appAuthorizations,
  authorizationBindings,
  oauthClientResource,
} from './infra/adapters/drizzle/schemas/index.js'
import {
  createAuthorizationStore,
  credentialDigest,
} from './infra/repositories/authorization-store.js'
import { createHttpFixture } from './test/http.js'
import {
  approveCode,
  createTestClients,
  exchangeCode,
  introspect,
  registerUser,
  userInfo,
} from './test/oauth.js'

test('live validation rejects wrong-client, ID, central-session, expired, unbound, and revoked credentials', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha, beta, operator } = await createTestClients(fixture)
    const { browser, user } = await registerUser(fixture)
    const store = createAuthorizationStore(fixture.store.database)
    const tokens = await exchangeCode(fixture, alpha, await approveCode(browser, alpha))
    assert.equal(
      (await (await introspect(fixture, alpha, tokens.access_token)).json()).active,
      true,
    )
    assert.equal((await userInfo(fixture, tokens.access_token)).status, 200)
    assert.equal(
      (await (await introspect(fixture, beta, tokens.access_token)).json()).active,
      false,
    )
    const anonymous = await fixture.request('/api/auth/oauth2/introspect', {
      method: 'POST',
      body: new URLSearchParams({ token: tokens.access_token }),
    })
    assert.equal(anonymous.status, 401)
    assert.notEqual((await anonymous.json()).active, true)
    const headers = new Headers({ cookie: operator.browser.cookie })
    await fixture.auth.api.adminUpdateOAuthClient({
      headers,
      body: { client_id: alpha.client_id, update: { disabled: true } },
    })
    assert.notEqual(
      (await (await introspect(fixture, alpha, tokens.access_token)).json()).active,
      true,
    )
    assert.ok((await userInfo(fixture, tokens.access_token)).status >= 400)
    await fixture.auth.api.adminUpdateOAuthClient({
      headers,
      body: { client_id: alpha.client_id, update: { disabled: false } },
    })
    assert.ok(tokens.id_token)
    const session = await fixture.store.database.query.session.findFirst()
    assert.ok(session)
    for (const credential of [tokens.id_token, session.token, browser.cookie]) {
      const response = await introspect(fixture, alpha, credential)
      assert.notEqual((await response.json()).active, true)
      assert.ok((await userInfo(fixture, credential)).status >= 400)
    }
    await fixture.store.database
      .update(authorizationBindings)
      .set({ expiresAt: new Date(0) })
      .where(eq(authorizationBindings.digest, credentialDigest(tokens.access_token)))
    assert.equal(
      (await (await introspect(fixture, alpha, tokens.access_token)).json()).active,
      false,
    )
    assert.equal((await userInfo(fixture, tokens.access_token)).status, 401)
    const unbound = await exchangeCode(fixture, alpha, await approveCode(browser, alpha))
    await fixture.store.database
      .delete(authorizationBindings)
      .where(eq(authorizationBindings.digest, credentialDigest(unbound.access_token)))
    assert.equal(
      (await (await introspect(fixture, alpha, unbound.access_token)).json()).active,
      false,
    )
    assert.equal((await userInfo(fixture, unbound.access_token)).status, 401)
    const revoked = await exchangeCode(fixture, alpha, await approveCode(browser, alpha))
    await store.revoke(user.id, alpha.client_id)
    assert.equal(
      (await (await introspect(fixture, alpha, revoked.access_token)).json()).active,
      false,
    )
    assert.equal((await userInfo(fixture, revoked.access_token)).status, 401)
  } finally {
    await fixture.close()
  }
})

test('current subject, scope, resource, and available authorization storage are mandatory', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha, beta } = await createTestClients(fixture)
    const { browser, user } = await registerUser(fixture)
    const other = await registerUser(fixture, 'other@example.com')
    const store = createAuthorizationStore(fixture.store.database)
    const tokens = await exchangeCode(fixture, alpha, await approveCode(browser, alpha))
    const authorization = await store.active(user.id, alpha.client_id)
    assert.ok(authorization)
    const otherApproval = await store.approve(
      other.user.id,
      alpha.client_id,
      authorization.scopes,
      new Date(),
    )
    const tokenDigest = credentialDigest(tokens.access_token)
    await fixture.store.database
      .update(authorizationBindings)
      .set({ authorizationId: otherApproval.id })
      .where(eq(authorizationBindings.digest, tokenDigest))
    assert.equal(
      (await (await introspect(fixture, alpha, tokens.access_token)).json()).active,
      false,
    )
    assert.equal((await userInfo(fixture, tokens.access_token)).status, 401)
    await fixture.store.database
      .update(authorizationBindings)
      .set({ authorizationId: authorization.id })
      .where(eq(authorizationBindings.digest, tokenDigest))
    await fixture.store.database
      .update(appAuthorizations)
      .set({ scopes: ['openid'] })
      .where(eq(appAuthorizations.id, authorization.id))
    assert.equal(
      (await (await introspect(fixture, alpha, tokens.access_token)).json()).active,
      false,
    )
    assert.equal((await userInfo(fixture, tokens.access_token)).status, 401)
    await fixture.store.database
      .update(appAuthorizations)
      .set({ scopes: authorization.scopes })
      .where(eq(appAuthorizations.id, authorization.id))
    await fixture.store.database
      .update(oauthClientResource)
      .set({ resourceId: beta.resource })
      .where(eq(oauthClientResource.clientId, alpha.client_id))
    assert.equal(
      (await (await introspect(fixture, alpha, tokens.access_token)).json()).active,
      false,
    )
    assert.equal((await userInfo(fixture, tokens.access_token)).status, 401)
    await fixture.store.database
      .update(oauthClientResource)
      .set({ resourceId: alpha.resource })
      .where(eq(oauthClientResource.clientId, alpha.client_id))
    await fixture.store.pool.query(
      'ALTER TABLE authorization_bindings RENAME TO unavailable_bindings',
    )
    const unavailable = await introspect(fixture, alpha, tokens.access_token)
    assert.equal(unavailable.status, 503)
    assert.notEqual((await unavailable.json()).active, true)
    assert.equal((await userInfo(fixture, tokens.access_token)).status, 503)
  } finally {
    await fixture.close()
  }
})
