const { createServer } = require('http')

const server = createServer((req, res) => {
   if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    res.end()
    return
  }

  if (req.url === '/validate') {
    console.log('Received request to /validate')
    console.log('Headers:', req.headers)
    const authHeader = req.headers['authorization']
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ valid: false, message: 'Missing or invalid Authorization header' }))
      return
    }

    const token = authHeader.split(' ')[1]
    // For demonstration purposes, we consider 'valid-token' as the only valid token
    if (token === 'valid-token') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-User-Sub': '12345',
        'X-User-Role': 'user',
      })
      return res.end(JSON.stringify({ valid: true }))
    } 
    res.writeHead(401, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ valid: false, message: 'Invalid token' }))
  }
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ message: 'Not Found' }))
})

const PORT = process.env.PORT || 3333

server.listen(PORT, () => {
  console.log(`Auth server running on port ${PORT}`)
})