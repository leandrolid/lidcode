import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { Auth } from '../auth.js'
import { user } from '../infra/adapters/drizzle/schemas/auth.js'
import { createHttpFixture, json } from './http.js'

export type HttpFixture = Awaited<ReturnType<typeof createHttpFixture>>

export function createBrowser(fixture: HttpFixture, cookie = '') {
  const jar = new Map<string, string>()
  for (const pair of cookie
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)) {
    const separator = pair.indexOf('=')
    jar.set(pair.slice(0, separator), pair.slice(separator + 1))
  }
  return {
    get cookie() {
      return [...jar].map(([key, value]) => `${key}=${value}`).join('; ')
    },
    async request(path: string, init?: RequestInit) {
      const headers = new Headers(init?.headers)
      headers.set('cookie', [...jar].map(([key, value]) => `${key}=${value}`).join('; '))
      const response = await fixture.request(path, { ...init, headers })
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(';')[0]
        if (!pair) continue
        const separator = pair.indexOf('=')
        const key = pair.slice(0, separator)
        if (/Max-Age=0(?:;|$)/i.test(cookie)) jar.delete(key)
        else jar.set(key, pair.slice(separator + 1))
      }
      return response
    },
  }
}

export type TestBrowser = ReturnType<typeof createBrowser>

export async function registerUser(fixture: HttpFixture, email = 'user@example.com') {
  const browser = createBrowser(fixture)
  const response = await browser.request(
    '/api/auth/sign-up/email',
    json({
      name: 'Test Account',
      email,
      password: 'test-only-password-123',
      callbackURL: '/profile',
    }),
  )
  assert.equal(response.status, 200, await response.clone().text())
  const verification = fixture.emails.filter((message) => message.to === email).at(-1)
  assert.ok(verification)
  const verified = await browser.request(verification.url)
  assert.equal(verified.status, 302)
  const sessionResponse = await browser.request('/api/auth/get-session')
  const session = (await sessionResponse.json()) as Auth['$Infer']['Session']
  assert.ok(session.user.emailVerified)
  return { browser, user: session.user }
}

export async function createTestClients(fixture: HttpFixture) {
  const operator = await registerUser(fixture, 'operator@example.com')
  await fixture.store.database
    .update(user)
    .set({ role: 'admin' })
    .where(eq(user.id, operator.user.id))
  const headers = new Headers({
    cookie: operator.browser.cookie,
    origin: fixture.env.AUTH_PUBLIC_ORIGIN,
  })
  const clients = []

  for (const name of ['alpha', 'beta']) {
    const resource = `https://${name}.example.com/api`
    await fixture.auth.api.adminCreateOAuthResource({
      headers,
      body: {
        identifier: resource,
        name,
        allowedScopes: ['openid', 'profile', 'email', 'offline_access'],
      },
    })
    const client = await fixture.auth.api.adminCreateOAuthClient({
      headers,
      body: {
        client_name: `Test ${name}`,
        redirect_uris: [`https://${name}.example.com/callback`],
        token_endpoint_auth_method: 'client_secret_basic',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
        scope: 'openid profile email offline_access',
        require_pkce: true,
        skip_consent: false,
        resources: [resource],
      },
    })
    assert.ok(client.client_secret)
    clients.push({ ...client, client_secret: client.client_secret, resource })
  }
  const [alpha, beta] = clients
  assert.ok(alpha && beta)
  return { alpha, beta, operator }
}

export type TestClient = {
  client_id: string
  client_secret: string
  redirect_uris: string[]
  resource: string
}

export function authorizationQuery(client: TestClient, overrides?: Record<string, string>) {
  const verifier = randomBytes(32).toString('base64url')
  const query = new URLSearchParams({
    client_id: client.client_id,
    redirect_uri: client.redirect_uris[0] ?? '',
    response_type: 'code',
    scope: 'openid profile email offline_access',
    resource: client.resource,
    state: randomBytes(16).toString('base64url'),
    nonce: randomBytes(16).toString('base64url'),
    code_challenge: createHash('sha256').update(verifier).digest('base64url'),
    code_challenge_method: 'S256',
    ...overrides,
  })
  return { verifier, query }
}

export async function responseRedirect(response: Response) {
  if (response.status === 302) {
    const location = response.headers.get('location')
    assert.ok(location)
    return new URL(location, 'http://localhost:3001')
  }
  assert.equal(response.status, 200, await response.clone().text())
  const data = await response.json()
  assert.equal(data.redirect, true)
  assert.equal(typeof data.url, 'string')
  return new URL(data.url, 'http://localhost:3001')
}

export async function approveCode(browser: TestBrowser, client: TestClient, scopes?: string) {
  const { verifier, query } = authorizationQuery(client, scopes ? { scope: scopes } : undefined)
  const response = await browser.request(`/api/auth/oauth2/authorize?${query}`)
  let redirect = await responseRedirect(response)
  if (redirect.pathname === '/consent') {
    const approval = await browser.request(
      '/api/auth/oauth2/consent',
      json({
        accept: true,
        oauth_query: redirect.search.slice(1),
      }),
    )
    redirect = await responseRedirect(approval)
  }
  const code = redirect.searchParams.get('code')
  assert.ok(code, redirect.href)
  assert.equal(redirect.searchParams.get('state'), query.get('state'))
  return { code, verifier, query }
}

export function tokenRequest(
  fixture: HttpFixture,
  client: TestClient,
  fields: Record<string, string>,
) {
  return fixture.request('/api/auth/oauth2/token', {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64')}`,
    },
    body: new URLSearchParams(fields),
  })
}

export async function exchangeCode(
  fixture: HttpFixture,
  client: TestClient,
  authorization: Awaited<ReturnType<typeof approveCode>>,
) {
  const response = await tokenRequest(fixture, client, {
    grant_type: 'authorization_code',
    code: authorization.code,
    code_verifier: authorization.verifier,
    redirect_uri: authorization.query.get('redirect_uri') ?? '',
    resource: client.resource,
  })
  assert.equal(response.status, 200, await response.clone().text())
  return (await response.json()) as {
    access_token: string
    refresh_token?: string
    id_token?: string
    token_type: string
    expires_in: number
    scope: string
  }
}

export function introspect(fixture: HttpFixture, client: TestClient, token: string) {
  return fixture.request('/api/auth/oauth2/introspect', {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${client.client_id}:${client.client_secret}`).toString('base64')}`,
    },
    body: new URLSearchParams({ token, token_type_hint: 'access_token' }),
  })
}

export function userInfo(fixture: HttpFixture, accessToken: string) {
  return fixture.request('/api/auth/oauth2/userinfo', {
    headers: { authorization: `Bearer ${accessToken}` },
  })
}
