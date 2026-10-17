import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture } from './test/http.js'
import {
  approveCode,
  createTestClients,
  exchangeCode,
  introspect,
  registerUser,
  tokenRequest,
  userInfo,
} from './test/oauth.js'

test('introspection and UserInfo retain stable identity and filter profile/email scopes', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha, beta } = await createTestClients(fixture)
    const { browser, user } = await registerUser(fixture)
    const profile = await exchangeCode(
      fixture,
      alpha,
      await approveCode(browser, alpha, 'openid profile'),
    )
    assert.equal(profile.refresh_token, undefined)
    const introspection = await introspect(fixture, alpha, profile.access_token)
    assert.equal(introspection.status, 200)
    const active = await introspection.json()
    assert.equal(active.active, true)
    assert.equal(active.sub, user.id)
    assert.equal(active.client_id, alpha.client_id)
    assert.equal(active.scope, 'openid profile')
    assert.ok(active.exp > Date.now() / 1000)
    const info = await userInfo(fixture, profile.access_token)
    assert.equal(info.status, 200)
    const identity = await info.json()
    assert.equal(identity.sub, user.id)
    assert.equal(identity.name, user.name)
    assert.equal(identity.email, undefined)
    assert.equal(identity.email_verified, undefined)
    assert.equal(
      (await (await introspect(fixture, beta, profile.access_token)).json()).active,
      false,
    )

    const email = await exchangeCode(
      fixture,
      alpha,
      await approveCode(browser, alpha, 'openid email'),
    )
    const emailInfo = await (await userInfo(fixture, email.access_token)).json()
    assert.equal(emailInfo.sub, user.id)
    assert.equal(emailInfo.email, user.email)
    assert.equal(emailInfo.email_verified, true)
    assert.equal(emailInfo.name, undefined)
    assert.equal(email.refresh_token, undefined)
  } finally {
    await fixture.close()
  }
})

test('renewal rotates without increasing access; consumed refresh tokens cannot replay', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const { browser, user } = await registerUser(fixture)
    const initial = await exchangeCode(fixture, alpha, await approveCode(browser, alpha))
    assert.ok(initial.refresh_token)
    const renewal = await tokenRequest(fixture, alpha, {
      grant_type: 'refresh_token',
      refresh_token: initial.refresh_token,
      resource: alpha.resource,
      scope: 'openid profile offline_access',
    })
    assert.equal(renewal.status, 200, await renewal.clone().text())
    const replacement = await renewal.json()
    assert.notEqual(replacement.refresh_token, initial.refresh_token)
    assert.ok(
      replacement.scope
        .split(' ')
        .every((scope: string) => initial.scope.split(' ').includes(scope)),
    )
    assert.ok(!replacement.scope.split(' ').includes('email'))
    const info = await (await userInfo(fixture, replacement.access_token)).json()
    assert.equal(info.sub, user.id)
    assert.equal(info.email, undefined)
    const current = await (await introspect(fixture, alpha, replacement.access_token)).json()
    assert.equal(current.active, true)
    assert.equal(current.client_id, alpha.client_id)

    const replay = await tokenRequest(fixture, alpha, {
      grant_type: 'refresh_token',
      refresh_token: initial.refresh_token,
      resource: alpha.resource,
    })
    assert.ok(replay.status >= 400)
    assert.ok(!(await replay.json()).access_token)
  } finally {
    await fixture.close()
  }
})

test('refresh cannot add identity scopes that the user did not approve', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const { browser } = await registerUser(fixture)
    const initial = await exchangeCode(
      fixture,
      alpha,
      await approveCode(browser, alpha, 'openid profile offline_access'),
    )
    assert.ok(initial.refresh_token)
    const escalation = await tokenRequest(fixture, alpha, {
      grant_type: 'refresh_token',
      refresh_token: initial.refresh_token,
      scope: 'openid profile email offline_access',
      resource: alpha.resource,
    })
    assert.ok(escalation.status >= 400)
    assert.ok(!(await escalation.json()).access_token)
  } finally {
    await fixture.close()
  }
})
