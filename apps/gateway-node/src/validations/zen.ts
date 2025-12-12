import type { IncomingMessage, ServerResponse } from 'node:http'
import type Zen from '@aikidosec/firewall'
import { StatusCode } from '../enums/status-code'

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
    res.writeHead(StatusCode.TOO_MANY_REQUESTS, { 'Content-Type': 'text/plain' })
    res.end('Too Many Requests\n')
    return false
  }
  if (result.block) {
    res.writeHead(StatusCode.FORBIDDEN, { 'Content-Type': 'text/plain' })
    res.end('Forbidden\n')
    return false
  }
  return true
}
