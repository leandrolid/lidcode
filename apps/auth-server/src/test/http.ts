import { once } from 'node:events'
import { createApp } from '../app.js'
import { createAuth } from '../auth.js'
import { parseEnv } from '../env.js'
import type { AccountEmail } from '../infra/services/account-email.js'
import { startServer } from '../server.js'
import { connectTestDatabase, createTestDatabase } from './database.js'

export async function createHttpFixture(options?: {
  inspectRequest?: (request: Request) => Promise<void>
  databaseUrl?: string
  environment?: NodeJS.ProcessEnv
}) {
  const store = options?.databaseUrl
    ? connectTestDatabase(options.databaseUrl)
    : await createTestDatabase()
  try {
    await store.migrate()
    const env = parseEnv({
      ...options?.environment,
      NODE_ENV: options?.environment?.NODE_ENV ?? 'test',
      AUTH_DATABASE_URL: store.url,
      AUTH_PUBLIC_ORIGIN: options?.environment?.AUTH_PUBLIC_ORIGIN ?? 'http://localhost:3001',
      AUTH_SECRET: 'isolated-http-test-secret-not-for-production',
    })
    const emails: AccountEmail[] = []
    const auth = createAuth(env, store.database, async (message) => {
      emails.push(message)
    })
    const handler = auth.handler
    auth.handler = async (request) => {
      await options?.inspectRequest?.(request.clone())
      return handler(request)
    }
    const app = createApp(auth, store.database, env)
    const runtime = startServer(app, 0, store.close)
    await once(runtime.server, 'listening')
    const address = runtime.server.address()
    if (!address || typeof address === 'string') throw new Error('Test HTTP server did not bind')
    const origin = `http://127.0.0.1:${address.port}`

    return {
      auth,
      env,
      emails,
      store,
      origin,
      close: runtime.close,
      request(path: string, init?: RequestInit) {
        const url = new URL(path, env.AUTH_PUBLIC_ORIGIN)
        const headers = new Headers(init?.headers)
        headers.set('origin', env.AUTH_PUBLIC_ORIGIN)
        return fetch(`${origin}${url.pathname}${url.search}`, {
          ...init,
          headers,
          redirect: 'manual',
        })
      },
    }
  } catch (error) {
    await store.close()
    throw error
  }
}

export function json(body: unknown, cookie?: string): RequestInit {
  const headers = new Headers({ 'content-type': 'application/json' })
  if (cookie) headers.set('cookie', cookie)
  return { method: 'POST', headers, body: JSON.stringify(body) }
}

export function cookies(response: Response) {
  return response.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ')
}
