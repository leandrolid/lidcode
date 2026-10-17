import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseEnv } from './env.js'

const development = {
  AUTH_DATABASE_URL: 'postgresql://localhost/auth_env_test',
  AUTH_SECRET: 'only-for-tests-not-a-production-secret',
}

const production = {
  ...development,
  NODE_ENV: 'production',
  AUTH_PUBLIC_ORIGIN: 'https://accounts.example.com',
  AUTH_DATABASE_SSL: 'true',
  AUTH_GOOGLE_CLIENT_ID: 'test-google-id',
  AUTH_GOOGLE_CLIENT_SECRET: 'test-google-secret',
  AUTH_GITHUB_CLIENT_ID: 'test-github-id',
  AUTH_GITHUB_CLIENT_SECRET: 'test-github-secret',
  AUTH_RESEND_API_KEY: 'test-email-key',
  AUTH_EMAIL_FROM: 'accounts@example.com',
}

test('production requires every deployment setting and HTTPS', () => {
  for (const key of Object.keys(production).filter((key) => key !== 'NODE_ENV')) {
    const input: NodeJS.ProcessEnv = { ...production }
    delete input[key]
    assert.throws(() => parseEnv(input), `Missing ${key} must fail`)
  }
  assert.throws(() =>
    parseEnv({ ...production, AUTH_PUBLIC_ORIGIN: 'http://accounts.example.com' }),
  )
})

test('canonical issuer only uses configured origin; PORT takes precedence', () => {
  const env = parseEnv({
    ...production,
    AUTH_PUBLIC_ORIGIN: 'https://accounts.example.com/',
    AUTH_PORT: '3334',
    PORT: '4567',
    HOST: 'attacker.example',
  })
  assert.equal(env.issuer, 'https://accounts.example.com/api/auth')
  assert.equal(env.AUTH_PUBLIC_ORIGIN, 'https://accounts.example.com')
  assert.equal(env.AUTH_PORT, 4567)
  assert.equal(env.AUTH_DATABASE_SSL, true)
})

test('development defaults do not supply secrets or a database', () => {
  assert.throws(() => parseEnv({}))
  const env = parseEnv(development)
  assert.equal(env.AUTH_PORT, 3334)
  assert.equal(env.AUTH_PUBLIC_ORIGIN, 'http://localhost:3001')
  assert.equal(env.AUTH_DATABASE_SSL, false)
})

test('invalid origins, ports, database URLs, and incomplete integrations fail', () => {
  for (const origin of [
    'https://accounts.example.com/path',
    'https://user:password@accounts.example.com',
    'https://accounts.example.com?query=true',
    'https://accounts.example.com/#fragment',
    'file:///accounts',
  ]) {
    assert.throws(() => parseEnv({ ...development, AUTH_PUBLIC_ORIGIN: origin }))
  }
  for (const port of ['', '0', '65536', '3334.5', 'not-a-port']) {
    assert.throws(() => parseEnv({ ...development, PORT: port }))
  }
  assert.throws(() => parseEnv({ ...development, AUTH_DATABASE_URL: 'https://example.com' }))
  assert.throws(() => parseEnv({ ...development, AUTH_GOOGLE_CLIENT_ID: 'incomplete' }))
  assert.throws(() => parseEnv({ ...development, AUTH_DATABASE_SSL: 'yes' }))
})
