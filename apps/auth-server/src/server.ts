import { serve } from '@hono/node-server'

export function startServer(
  app: { fetch: Parameters<typeof serve>[0]['fetch'] },
  port: number,
  closeDatabase: () => Promise<void>,
) {
  const server = serve({ fetch: app.fetch, port })
  let closing: Promise<void> | undefined

  function close() {
    closing ??= (async () => {
      try {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()))
        })
      } finally {
        await closeDatabase()
      }
    })()
    return closing
  }

  return { server, close }
}
