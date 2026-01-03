/**
 * Global Error Handling Middleware
 * Provides a centralized point for catching and formatting all application errors.
 */
export default function errorHandler(error, _request, response, _next) {
  // 1. Handle Express JSON parsing errors (Malformed JSON)
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({
      error: {
        message: 'Invalid JSON payload',
        code: 'BAD_REQUEST',
      },
    })
  }

  // 2. Default Error Configuration
  const statusCode = error.status || error.statusCode || 500
  const environment = process.env.NODE_ENV || 'development'

  // 3. Log the error for internal tracking
  // In a real production app, consider using a logger like 'pino' or 'winston'
  console.error(`[Error] ${error.name}: ${error.message}`)
  if (environment === 'development') {
    console.error(error.stack)
  }

  // 4. Secure Response
  // We never send the full error stack to the client in production to prevent information leakage.
  response.status(statusCode).json({
    error: {
      message:
        environment === 'production' && statusCode === 500
          ? 'Internal Server Error'
          : error.message,
      code: error.code || 'INTERNAL_ERROR',
      // Only include stack trace in development mode
      ...(environment === 'development' && { stack: error.stack }),
    },
  })
}
