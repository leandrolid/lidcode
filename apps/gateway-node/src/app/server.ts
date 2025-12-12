import zen from '@aikidosec/firewall'

import { createServer } from 'node:http'
import { proxyRequest } from './proxy'

import { zenValidation } from '../validations/zen'
import { env } from '../env'
import { jwtValidation } from '../validations/jwt-validation'
import { StatusCode } from '../enums/status-code'
import { getUpstream } from './upstream'

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
  if (req.url === '/health') {
    res.writeHead(StatusCode.OK, { 'Content-Type': 'text/plain' })
    res.end('OK\n')
    return
  }
  return proxyRequest(req, res, getUpstream(req))
})

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
