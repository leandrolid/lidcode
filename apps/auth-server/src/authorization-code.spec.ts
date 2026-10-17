import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAuthorizationStore } from './infra/repositories/authorization-store.js'
import { createHttpFixture, json } from './test/http.js'
import {
  approveCode,
  authorizationQuery,
  createTestClients,
  registerUser,
  responseRedirect,
} from './test/oauth.js'

test('only explicit approval creates a lifecycle; codes inherit it across reuse and scope expansion', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const { browser, user } = await registerUser(fixture)
    const store = createAuthorizationStore(fixture.store.database)
    const request = authorizationQuery(alpha)
    const pending = await responseRedirect(
      await browser.request(`/api/auth/oauth2/authorize?${request.query}`),
    )
    assert.equal(pending.pathname, '/consent')
    assert.equal(await store.active(user.id, alpha.client_id), null)
    const denied = await responseRedirect(
      await browser.request(
        '/api/auth/oauth2/consent',
        json({
          accept: false,
          oauth_query: pending.search.slice(1),
          userId: 'another-user',
          authorizationId: 'invented',
        }),
      ),
    )
    assert.equal(denied.searchParams.get('error'), 'access_denied')
    assert.equal(await store.active(user.id, alpha.client_id), null)

    const first = await approveCode(browser, alpha, 'openid profile')
    const initial = await store.resolve('code', first.code)
    assert.ok(initial)
    assert.equal(initial.authorization.userId, user.id)
    assert.deepEqual(initial.authorization.scopes, ['openid', 'profile'])
    const routine = authorizationQuery(alpha, { scope: 'openid profile' })
    const callback = await responseRedirect(
      await browser.request(`/api/auth/oauth2/authorize?${routine.query}`),
    )
    const routineCode = callback.searchParams.get('code')
    assert.ok(routineCode)
    assert.equal(
      (await store.resolve('code', routineCode))?.authorization.id,
      initial.authorization.id,
    )

    const expanded = authorizationQuery(alpha)
    const consent = await responseRedirect(
      await browser.request(`/api/auth/oauth2/authorize?${expanded.query}`),
    )
    assert.equal(consent.pathname, '/consent')
    const approved = await responseRedirect(
      await browser.request(
        '/api/auth/oauth2/consent',
        json({
          accept: true,
          oauth_query: consent.search.slice(1),
          userId: 'another-user',
          authorizationId: 'invented',
        }),
      ),
    )
    const expandedCode = approved.searchParams.get('code')
    assert.ok(expandedCode)
    const binding = await store.resolve('code', expandedCode)
    assert.equal(binding?.authorization.id, initial.authorization.id)
    assert.deepEqual(binding?.authorization.scopes, [
      'openid',
      'profile',
      'email',
      'offline_access',
    ])
    assert.equal(
      (await store.resolve('code', first.code))?.authorization.id,
      initial.authorization.id,
    )
  } finally {
    await fixture.close()
  }
})
