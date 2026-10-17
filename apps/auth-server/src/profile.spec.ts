import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture, json } from './test/http.js'
import {
  approveCode,
  createTestClients,
  exchangeCode,
  registerUser,
  userInfo,
} from './test/oauth.js'

test('profile editing allows only own name/avatar and updates appropriately scoped UserInfo', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const { browser, user } = await registerUser(fixture)
    const other = await registerUser(fixture, 'other@example.com')
    const tokens = await exchangeCode(
      fixture,
      alpha,
      await approveCode(browser, alpha, 'openid profile email'),
    )
    assert.equal((await fixture.request('/api/v1/me')).status, 401)
    const update = await browser.request('/api/v1/me', {
      ...json({ name: 'Edited Name', image: 'https://images.example.com/new.png' }),
      method: 'PATCH',
    })
    assert.equal(update.status, 200)
    const edited = await update.json()
    assert.equal(edited.user.id, user.id)
    assert.equal(edited.user.email, user.email)
    assert.equal(edited.user.name, 'Edited Name')
    assert.equal(edited.user.image, 'https://images.example.com/new.png')
    const current = await (await browser.request('/api/v1/me')).json()
    assert.deepEqual(current, edited)
    const claims = await (await userInfo(fixture, tokens.access_token)).json()
    assert.equal(claims.sub, user.id)
    assert.equal(claims.name, 'Edited Name')
    assert.equal(claims.picture, 'https://images.example.com/new.png')
    assert.equal(claims.email, user.email)
    for (const fields of [
      { id: other.user.id },
      { userId: other.user.id },
      { role: 'admin' },
      { emailVerified: false },
      { email: 'replacement@example.com' },
      { name: '' },
      { image: 'javascript:alert(1)' },
    ]) {
      const response = await browser.request('/api/v1/me', { ...json(fields), method: 'PATCH' })
      assert.equal(response.status, 400)
    }
    const unchanged = await (await browser.request('/api/v1/me')).json()
    assert.equal(unchanged.user.id, user.id)
    assert.equal(unchanged.user.role, 'user')
    assert.equal(unchanged.user.emailVerified, true)
    assert.equal(unchanged.user.name, 'Edited Name')
    assert.equal(
      (await (await other.browser.request('/api/v1/me')).json()).user.name,
      other.user.name,
    )
    const native = await browser.request(
      '/api/auth/update-user',
      json({ name: 'bypass', role: 'admin' }),
    )
    assert.equal(native.status, 404)
    const emailOnly = await exchangeCode(
      fixture,
      alpha,
      await approveCode(browser, alpha, 'openid email'),
    )
    assert.equal((await (await userInfo(fixture, emailOnly.access_token)).json()).name, undefined)
  } finally {
    await fixture.close()
  }
})
