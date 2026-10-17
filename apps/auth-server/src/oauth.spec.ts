import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createLocalJWKSet, jwtVerify } from 'jose'
import { createHttpFixture, json } from './test/http.js'
import {
  authorizationQuery,
  createBrowser,
  createTestClients,
  exchangeCode,
  registerUser,
  responseRedirect,
} from './test/oauth.js'

test('native login continuation, consent, code exchange, and signed OIDC identity', async () => {
  const fixture = await createHttpFixture()
  try {
    const { alpha } = await createTestClients(fixture)
    const registered = await registerUser(fixture)
    const browser = createBrowser(fixture)
    const { query, verifier } = authorizationQuery(alpha)
    const authorize = await browser.request(`/api/auth/oauth2/authorize?${query}`, {
      headers: { accept: 'text/html' },
    })
    const login = await responseRedirect(authorize)
    assert.equal(login.pathname, '/login')
    assert.ok(login.searchParams.get('sig'))

    const signedIn = await browser.request(
      '/api/auth/sign-in/email',
      json({
        email: registered.user.email,
        password: 'test-only-password-123',
        oauth_query: login.search.slice(1),
      }),
    )
    const consent = await responseRedirect(signedIn)
    assert.equal(consent.pathname, '/consent')
    assert.equal(consent.searchParams.get('client_id'), alpha.client_id)
    const approved = await browser.request(
      '/api/auth/oauth2/consent',
      json({
        accept: true,
        oauth_query: consent.search.slice(1),
      }),
    )
    const callback = await responseRedirect(approved)
    assert.equal(`${callback.origin}${callback.pathname}`, alpha.redirect_uris[0])
    assert.equal(callback.searchParams.get('state'), query.get('state'))
    assert.equal(callback.searchParams.get('iss'), fixture.env.issuer)
    const code = callback.searchParams.get('code')
    assert.ok(code)
    const tokens = await exchangeCode(fixture, alpha, { code, verifier, query })
    assert.equal(tokens.token_type.toLowerCase(), 'bearer')
    assert.equal(tokens.expires_in, 900)
    assert.ok(tokens.refresh_token)
    assert.ok(tokens.id_token)
    assert.notEqual(tokens.access_token, tokens.id_token)

    const discoveryResponse = await fixture.request('/api/auth/.well-known/openid-configuration')
    const discovery = await discoveryResponse.json()
    assert.equal(discovery.issuer, fixture.env.issuer)
    assert.deepEqual(discovery.grant_types_supported, ['authorization_code', 'refresh_token'])
    assert.deepEqual(discovery.code_challenge_methods_supported, ['S256'])
    assert.ok(discovery.token_endpoint_auth_methods_supported.includes('client_secret_basic'))
    for (const key of [
      'authorization_endpoint',
      'token_endpoint',
      'userinfo_endpoint',
      'jwks_uri',
      'introspection_endpoint',
    ]) {
      assert.ok(discovery[key].startsWith(fixture.env.issuer))
    }
    const keys = await (await fixture.request(discovery.jwks_uri)).json()
    const { payload } = await jwtVerify(tokens.id_token, createLocalJWKSet(keys), {
      issuer: fixture.env.issuer,
      audience: alpha.client_id,
    })
    assert.equal(payload.sub, registered.user.id)
    assert.equal(payload.nonce, query.get('nonce'))
    assert.ok(typeof payload.exp === 'number' && payload.exp > Date.now() / 1000)
    const access = await jwtVerify(tokens.access_token, createLocalJWKSet(keys), {
      issuer: fixture.env.issuer,
      audience: alpha.resource,
    })
    assert.equal(access.payload.sub, registered.user.id)
  } finally {
    await fixture.close()
  }
})
