import { request as httpRequest, type IncomingMessage, type ServerResponse } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { URL } from 'node:url'
import { StatusCode } from '../enums/status-code'
import { Ports } from '../enums/ports'

export function proxyRequest(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage> & {
    req: IncomingMessage
  },
  targetUrl: string,
) {
  const target = new URL(targetUrl)
  const isHttps = target.protocol === 'https:'
  const request = isHttps ? httpsRequest : httpRequest
  const options = {
    hostname: target.hostname,
    port: target.port || (isHttps ? Ports.HTTPS : Ports.HTTP),
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: target.host,
      'x-forwarded-for': req.socket.remoteAddress,
      'x-forwarded-proto': 'encrypted' in req.socket && req.socket.encrypted ? 'https' : 'http',
      'x-forwarded-host': req.headers.host,
      'x-user-sub': req.user ? req.user.id : '',
      'x-user-name': req.user ? req.user.name : '',
    },
  }
  // Remove hop-by-hop headers
  delete options.headers['connection']
  delete options.headers['upgrade']
  delete options.headers['proxy-authorization']
  delete options.headers['proxy-authenticate']
  const proxyReq = request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || StatusCode.INTERNAL_SERVER_ERROR, proxyRes.headers)
    proxyRes.pipe(res, { end: true })
  })
  proxyReq.on('error', (err) => {
    console.error(`Proxy error for ${targetUrl}:`, err.message)
    if (!res.headersSent) {
      res.writeHead(StatusCode.BAD_GATEWAY, { 'Content-Type': 'text/plain' })
      res.end('Bad Gateway\n')
    }
  })
  proxyReq.setTimeout(30000, () => {
    proxyReq.destroy()
    if (!res.headersSent) {
      res.writeHead(StatusCode.GATEWAY_TIMEOUT, { 'Content-Type': 'text/plain' })
      res.end('Gateway Timeout\n')
    }
  })
  // Pipe request body from client to upstream
  req.pipe(proxyReq, { end: true })
}
