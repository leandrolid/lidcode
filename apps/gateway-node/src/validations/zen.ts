import type { IncomingMessage, ServerResponse } from 'node:http'
import type Zen from '@aikidosec/firewall'

export function zenValidation(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage> & {
    req: IncomingMessage
  },
  zen: typeof Zen,
) {
  zen.setUser(
    req.user
      ? req.user
      : {
          id: req.socket.remoteAddress || 'anonymous',
          name: req.headers['user-agent'] || 'unknown',
        },
  )
  const result = zen.shouldBlockRequest()
  if (result.block && result.type === 'ratelimited') {
    res.writeHead(429, { 'Content-Type': 'text/plain' })
    res.end('Too Many Requests\n')
    return false
  }
  if (result.block) {
    res.writeHead(403, { 'Content-Type': 'text/plain' })
    res.end('Forbidden\n')
    return false
  }
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' })
    res.end('OK\n')
    return false
  }
  return true
}
