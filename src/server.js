import http from 'node:http'

import 'dotenv/config'
import app from './app.js'

const normalizePort = (value) => {
  const port = Number.parseInt(value, 10)

  if (Number.isNaN(port)) {
    return value
  }
  if (port >= 0) {
    return port
  }
  return false
}
const port = normalizePort(process.env.NODE_JS_PORT || '3000')
app.set('port', port)

const errorHandler = (error) => {
  if (error.syscall !== 'listen') {
    throw error
  }
  const address = server.address()
  const bind = typeof address === 'string' ? `pipe ${address}` : `port: ${port}`
  switch (error.code) {
    case 'EACCES': {
      console.error(`${bind} requires elevated privileges.`)
      throw new Error(
        'Impossible to bind this port, elevated privileges required',
      )
    }
    case 'EADDRINUSE': {
      console.error(`${bind} is already in use.`)
      throw new Error('Impossible to bind this port, already in use')
    }
    default: {
      throw error
    }
  }
}

const server = http.createServer(app)

server.on('error', errorHandler)
server.on('listening', () => {
  const address = server.address()
  const bind = typeof address === 'string' ? `pipe ${address}` : `port ${port}`
  console.log(`Listening on ${bind}`)
})

server.listen(port)
