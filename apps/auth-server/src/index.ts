import { serveStatic } from '@hono/node-server/serve-static'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { createAuth } from './auth.js'
import { parseEnv } from './env.js'
import { createDatabase } from './infra/adapters/drizzle/client.js'
import { startServer } from './server.js'

try {
  const env = parseEnv(process.env)
  const database = createDatabase(env)
  const auth = createAuth(env, database.database)
  const app = createApp(auth, database.database, env)
  const portalRoot = fileURLToPath(new URL('../../auth-web/dist/', import.meta.url))

  // Protocol namespaces terminate before static files and the portal's deep-link fallback.
  app.all('/api/*', (context) => context.json({ error: 'not_found' }, 404))
  app.all('/api', (context) => context.json({ error: 'not_found' }, 404))
  app.all('/.well-known', (context) => context.json({ error: 'not_found' }, 404))
  app.use('*', serveStatic({ root: portalRoot }))
  app.get('/assets/*', (context) => context.json({ error: 'not_found' }, 404))
  app.get('*', serveStatic({ root: portalRoot, path: 'index.html' }))

  const runtime = startServer(
    app,
    env.AUTH_PORT,
    database.close,
  )

  function shutdown() {
    void runtime.close().catch(() => {
      console.error('Auth shutdown failed')
      process.exitCode = 1
    })
  }

  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)
  runtime.server.once('error', () => {
    console.error('Auth HTTP server failed to start')
    process.exitCode = 1
    shutdown()
  })
} catch {
  console.error('Auth startup failed: check the required AUTH_* environment settings')
  process.exitCode = 1
}
