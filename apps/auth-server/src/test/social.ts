import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { exportJWK, generateKeyPair, SignJWT } from 'jose'
import { json } from './http.js'
import type { TestBrowser } from './oauth.js'

export const socialEnvironment = {
  AUTH_GOOGLE_CLIENT_ID: 'google-test-client',
  AUTH_GOOGLE_CLIENT_SECRET: 'google-test-secret',
  AUTH_GITHUB_CLIENT_ID: 'github-test-client',
  AUTH_GITHUB_CLIENT_SECRET: 'github-test-secret',
}

type SocialIdentity = {
  id: string
  email?: string
  verified: boolean
  name?: string
  failToken?: boolean
}

export async function mockSocialProviders(context: TestContext) {
  const nativeFetch = globalThis.fetch
  const keys = await generateKeyPair('RS256')
  const publicKey = {
    ...(await exportJWK(keys.publicKey)),
    kid: 'social-test-key',
    alg: 'RS256',
    use: 'sig',
  }
  let identity: SocialIdentity = { id: 'unset', verified: false }
  let nonce: string | undefined

  context.mock.method(
    globalThis,
    'fetch',
    async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : input.toString())
      if (['127.0.0.1', 'localhost'].includes(url.hostname)) return nativeFetch(input, init)
      if (url.hostname === 'oauth2.googleapis.com' && url.pathname === '/token') {
        if (identity.failToken) return Response.json({ error: 'invalid_grant' }, { status: 400 })
        const idToken = await new SignJWT({
          email: identity.email,
          email_verified: identity.verified,
          name: identity.name ?? 'Social User',
          nonce,
          picture: 'https://images.example.com/avatar.png',
        })
          .setProtectedHeader({ alg: 'RS256', kid: 'social-test-key' })
          .setIssuer('https://accounts.google.com')
          .setAudience(socialEnvironment.AUTH_GOOGLE_CLIENT_ID)
          .setSubject(identity.id)
          .setIssuedAt()
          .setExpirationTime('5m')
          .sign(keys.privateKey)
        return Response.json({
          access_token: 'google-test-access',
          token_type: 'Bearer',
          expires_in: 300,
          id_token: idToken,
        })
      }
      if (url.hostname === 'www.googleapis.com' && url.pathname.includes('certs')) {
        return Response.json({ keys: [publicKey] })
      }
      if (url.hostname === 'github.com' && url.pathname === '/login/oauth/access_token') {
        if (identity.failToken)
          return Response.json({ error: 'bad_verification_code' }, { status: 400 })
        return Response.json({
          access_token: 'github-test-access',
          token_type: 'bearer',
          scope: 'read:user,user:email',
        })
      }
      if (url.hostname === 'api.github.com' && url.pathname === '/user') {
        return Response.json({
          id: identity.id,
          login: identity.id,
          name: identity.name ?? 'Social User',
          email: identity.email ?? null,
          avatar_url: 'https://images.example.com/avatar.png',
        })
      }
      if (url.hostname === 'api.github.com' && url.pathname === '/user/emails') {
        return Response.json(
          identity.email
            ? [{ email: identity.email, verified: identity.verified, primary: true }]
            : [],
        )
      }
      throw new Error(`Unexpected outbound social-provider request: ${url.origin}${url.pathname}`)
    },
  )

  return {
    select(profile: SocialIdentity, requestNonce?: string) {
      identity = profile
      nonce = requestNonce
    },
    async complete(
      browser: TestBrowser,
      provider: 'google' | 'github',
      profile: SocialIdentity,
      link = false,
    ) {
      const start = await browser.request(
        link ? '/api/auth/link-social' : '/api/auth/sign-in/social',
        json({
          provider,
          callbackURL: '/profile',
          errorCallbackURL: '/login',
          disableRedirect: true,
        }),
      )
      assert.equal(start.status, 200, await start.clone().text())
      const result = await start.json()
      const target = new URL(result.url)
      const state = target.searchParams.get('state')
      assert.ok(state)
      identity = profile
      nonce = target.searchParams.get('nonce') ?? undefined
      const query = new URLSearchParams({ state, code: `code-for-${profile.id}` })
      return browser.request(`/api/auth/callback/${provider}?${query}`)
    },
  }
}
