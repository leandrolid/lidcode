import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createHttpFixture } from './test/http.js'
import { createBrowser } from './test/oauth.js'
import { mockSocialProviders, socialEnvironment } from './test/social.js'

for (const provider of ['google', 'github'] as const) {
  test(`${provider} supports new/returning users and rejects failed or unverified identities`, async (context) => {
    const social = await mockSocialProviders(context)
    const fixture = await createHttpFixture({ environment: socialEnvironment })
    try {
      const browser = createBrowser(fixture)
      const identity = {
        id: `${provider}-subject`,
        email: `${provider}@example.com`,
        verified: true,
      }
      const registered = await social.complete(browser, provider, identity)
      assert.equal(registered.status, 302)
      assert.ok(
        !registered.headers.get('location')?.includes('error='),
        registered.headers.get('location') ?? '',
      )
      const session = await (await browser.request('/api/auth/get-session')).json()
      assert.equal(session.user.email, identity.email)
      assert.equal(session.user.emailVerified, true)
      const returning = createBrowser(fixture)
      const signedIn = await social.complete(returning, provider, identity)
      assert.equal(signedIn.status, 302)
      assert.equal(
        (await (await returning.request('/api/auth/get-session')).json()).user.id,
        session.user.id,
      )
      for (const profile of [
        { id: `${provider}-missing-email`, verified: true },
        {
          id: `${provider}-unverified`,
          email: `unverified-${provider}@example.com`,
          verified: false,
        },
        {
          id: `${provider}-failed`,
          email: `failed-${provider}@example.com`,
          verified: true,
          failToken: true,
        },
      ]) {
        const isolated = await createHttpFixture({ environment: socialEnvironment })
        try {
          const rejected = createBrowser(isolated)
          const callback = await social.complete(rejected, provider, profile)
          assert.equal(callback.status, 302)
          assert.ok(callback.headers.get('location')?.includes('error='))
          assert.equal(await (await rejected.request('/api/auth/get-session')).json(), null)
          assert.equal((await isolated.store.database.query.user.findMany()).length, 0)
        } finally {
          await isolated.close()
        }
      }
      assert.equal((await fixture.store.database.query.user.findMany()).length, 1)
    } finally {
      await fixture.close()
    }
  })
}
