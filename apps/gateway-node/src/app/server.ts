import zen from '@aikidosec/firewall'

import { createServer } from 'node:http'
import { proxyRequest } from './proxy'
import { Upstreams } from '../constants/upstreams'

import { zenValidation } from '../validations/zen'
import { env } from '../env'
import { jwtValidation } from '../validations/jwt-validation'

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }
  if (!jwtValidation(req, res)) return
  if (!zenValidation(req, res, zen)) return
  return proxyRequest(req, res, getUpstreamForPath(req.url || ''))
})

function getUpstreamForPath(path: string): string {
  if (path.startsWith('/v2/urls')) {
    return Upstreams.SHORTLID
  }
  return Upstreams.LIDCODE
}

server.listen(env.PORT, () => {
  console.log(`Worker ${process.pid} started.`)
  console.log(`Server is running at http://localhost:${env.PORT}/`)
})

function shutdown() {
  console.log('Shutting down server...')
  server.close(() => {
    console.log('Server closed.')
    process.exit(0)
  })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
