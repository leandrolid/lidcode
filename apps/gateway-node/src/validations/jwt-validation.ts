import type { IncomingMessage, ServerResponse } from 'node:http'
import jws from 'jws'
import { env } from '../env'
import { StatusCode } from '../constants/status-code'

export function jwtValidation(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage> & {
    req: IncomingMessage
  },
) {
  if (!req.url?.startsWith('/v2')) {
    return true
  }
  const [bearer, token] = (req.headers.authorization || '').split(' ')
  if (bearer !== 'Bearer' || !token) {
    res.writeHead(StatusCode.UNAUTHORIZED, { 'Content-Type': 'text/plain' })
    res.end('Unauthorized\n')
    return false
  }
  const isvalid = jws.verify(token, 'HS256', env.JWT_SECRET)
  if (!isvalid) {
    res.writeHead(StatusCode.UNAUTHORIZED, { 'Content-Type': 'text/plain' })
    res.end('Unauthorized\n')
    return false
  }
  const decoded = jws.decode(token)
  if (!decoded || typeof decoded.payload !== 'object') {
    res.writeHead(StatusCode.UNAUTHORIZED, { 'Content-Type': 'text/plain' })
    res.end('Unauthorized\n')
    return false
  }
  req.user = {
    id: decoded.payload.sub,
    name: decoded.payload.name,
  }
  return true
}
