import assert from 'node:assert/strict'
import { test } from 'node:test'
import { eq } from 'drizzle-orm'
import { user } from './infra/adapters/drizzle/schemas/auth.js'
import { createHttpFixture } from './test/http.js'
import { createBrowser, registerUser } from './test/oauth.js'
import { mockSocialProviders, socialEnvironment } from './test/social.js'

test('same-email sign-in cannot auto-merge; explicit linking preserves identity/profile and rejects provider reuse', async (context) => {
  const social = await mockSocialProviders(context)
  const fixture = await createHttpFixture({ environment: socialEnvironment })
  try {
    const current = await registerUser(fixture)
    await fixture.store.database
      .update(user)
      .set({ name: 'Edited Profile', image: 'https://images.example.com/edited.png' })
      .where(eq(user.id, current.user.id))
    const provider = {
      id: 'google-linked-identity',
      email: current.user.email,
      verified: true,
      name: 'Provider Profile',
    }
    const collision = await social.complete(createBrowser(fixture), 'google', provider)
    assert.ok(collision.headers.get('location')?.includes('account_not_linked'))
    assert.equal((await fixture.store.database.query.account.findMany()).length, 1)
    const linked = await social.complete(current.browser, 'google', provider, true)
    assert.equal(linked.status, 302)
    assert.ok(!linked.headers.get('location')?.includes('error='))
    const profile = await (await current.browser.request('/api/auth/get-session')).json()
    assert.equal(profile.user.id, current.user.id)
    assert.equal(profile.user.name, 'Edited Profile')
    assert.equal(profile.user.image, 'https://images.example.com/edited.png')
    const methods = await (await current.browser.request('/api/v1/me/sign-in-methods')).json()
    assert.deepEqual(
      methods.methods.map((method: { provider: string }) => method.provider).sort(),
      ['credential', 'google'],
    )
    assert.ok(!JSON.stringify(methods).includes('accessToken'))
    const other = await registerUser(fixture, 'other@example.com')
    const reused = await social.complete(
      other.browser,
      'google',
      { ...provider, email: other.user.email },
      true,
    )
    assert.ok(reused.headers.get('location')?.includes('error='))
    const owned = await fixture.store.database.query.account.findMany()
    assert.equal(owned.filter((method) => method.providerId === 'google').length, 1)
    assert.equal(owned.find((method) => method.providerId === 'google')?.userId, current.user.id)
    const google = methods.methods.find(
      (method: { provider: string }) => method.provider === 'google',
    )
    const password = methods.methods.find(
      (method: { provider: string }) => method.provider === 'credential',
    )
    assert.equal(
      (await other.browser.request(`/api/v1/me/sign-in-methods/${google.id}`, { method: 'DELETE' }))
        .status,
      404,
    )
    assert.equal(
      (
        await current.browser.request(`/api/v1/me/sign-in-methods/${google.id}`, {
          method: 'DELETE',
        })
      ).status,
      200,
    )
    assert.equal(
      (
        await current.browser.request(`/api/v1/me/sign-in-methods/${password.id}`, {
          method: 'DELETE',
        })
      ).status,
      400,
    )
  } finally {
    await fixture.close()
  }
})

test('last usable method survives concurrent removals; direct native unlink is disabled', async (context) => {
  const social = await mockSocialProviders(context)
  const fixture = await createHttpFixture({ environment: socialEnvironment })
  try {
    const current = await registerUser(fixture)
    await social.complete(
      current.browser,
      'github',
      { id: 'concurrent-github', email: current.user.email, verified: true },
      true,
    )
    const listing = await (await current.browser.request('/api/v1/me/sign-in-methods')).json()
    assert.equal(listing.methods.length, 2)
    const responses = await Promise.all(
      listing.methods.map((method: { id: string }) =>
        current.browser.request(`/api/v1/me/sign-in-methods/${method.id}`, { method: 'DELETE' }),
      ),
    )
    assert.equal(responses.filter((response: Response) => response.status === 200).length, 1)
    assert.equal(responses.filter((response: Response) => response.status === 400).length, 1)
    const remaining = await (await current.browser.request('/api/v1/me/sign-in-methods')).json()
    assert.equal(remaining.methods.length, 1)
    assert.equal(remaining.methods[0].usable, true)
    const native = await current.browser.request('/api/auth/unlink-account', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ accountId: remaining.methods[0].id }),
    })
    assert.equal(native.status, 404)
  } finally {
    await fixture.close()
  }
})
