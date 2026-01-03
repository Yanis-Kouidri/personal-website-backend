import http from 'node:http'
import process from 'node:process'
import app from './app.js'

/**
 * Normalize a port into a number, string, or false.
 */
const normalizePort = (value) => {
  const port = Number.parseInt(value, 10)

  if (Number.isNaN(port)) {
    return value // named pipe
  }
  if (port >= 0) {
    return port // port number
  }
  return false
}

const port = normalizePort(process.env.PORT || '3000')
app.set('port', port)

/**
 * Event listener for HTTP server "error" event.
 */
const errorHandler = (error) => {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges.`)
      process.exit(1)
      break
    case 'EADDRINUSE':
      console.error(`${bind} is already in use.`)
      process.exit(1)
      break
    default:
      throw error
  }
}

const server = http.createServer(app)

server.on('error', errorHandler)
server.on('listening', () => {
  const address = server.address()
  const bind =
    typeof address === 'string' ? `pipe ${address}` : `port ${address.port}`
  console.info(
    `Server is running on ${bind} [${process.env.NODE_ENV || 'development'}]`,
  )
})

// Start the server
server.listen(port)

/**
 * Graceful shutdown management.
 * Essential for Docker, Kubernetes, and professional hosting services.
 */
const shutdown = (signal) => {
  console.info(`${signal} signal received: closing HTTP server...`)
  server.close(() => {
    console.info('HTTP server closed.')
    // Close database connections here if necessary
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
