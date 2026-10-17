import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { test } from 'node:test'
import { Hono } from 'hono'
import { startServer } from './server.js'

test('shutdown drains HTTP requests before closing the database, exactly once', async () => {
  const app = new Hono()
  let finishRequest: (() => void) | undefined
  const started = new Promise<void>((resolve) => {
    app.get('/slow', async (context) => {
      await new Promise<void>((finish) => {
        finishRequest = finish
        resolve()
      })
      return context.text('complete')
    })
  })
  let databaseCloseCount = 0
  const runtime = startServer(app, 0, async () => {
    databaseCloseCount++
  })
  await once(runtime.server, 'listening')
  const address = runtime.server.address()
  assert.ok(address && typeof address !== 'string')
  const origin = `http://127.0.0.1:${address.port}`
  const request = fetch(`${origin}/slow`)
  await started
  const closing = runtime.close()
  assert.equal(runtime.close(), closing)
  assert.equal(databaseCloseCount, 0)
  assert.ok(finishRequest)
  finishRequest()
  assert.equal(await (await request).text(), 'complete')
  await closing
  assert.equal(databaseCloseCount, 1)
  await assert.rejects(fetch(`${origin}/healthz`))
})

test('entry point rejects incomplete production settings without logging their values', async () => {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: new URL('../', import.meta.url),
    env: { NODE_ENV: 'production', AUTH_SECRET: 'do-not-log-this-value' },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  let output = ''
  child.stderr.setEncoding('utf8').on('data', (chunk: string) => {
    output += chunk
  })
  const [code] = await once(child, 'exit')
  assert.equal(code, 1)
  assert.match(output, /Auth startup failed/)
  assert.ok(!output.includes('do-not-log-this-value'))
})
