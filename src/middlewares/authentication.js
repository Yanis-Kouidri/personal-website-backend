import process from 'node:process'
import { jwtVerify } from 'jose'
// Consideration: Move TOKEN_COOKIE_NAME to a config/constants.js file to avoid circular dependencies
import { TOKEN_COOKIE_NAME } from '../controllers/authentication.js'

/**
 * Middleware to authenticate requests via JWT stored in cookies.
 */
async function authentication(request, response, next) {
  const token = request.cookies[TOKEN_COOKIE_NAME]

  if (!token) {
    return response.status(401).json({
      message: 'Authentication required. Please log in.',
    })
  }

  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    console.error(
      'Critical Error: JWT_SECRET is not defined in environment variables.',
    )
    return response.status(500).json({
      message: 'Internal server error configuration.',
    })
  }

  try {
    // Standardize secret encoding for Web Crypto API
    const secret = new TextEncoder().encode(jwtSecret)

    // Verify the token
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'], // Explicitly define the expected algorithm for security
    })

    /**
     * Attach user data to the request object.
     * Use 'request.user' as a standard convention in Express.
     */
    request.user = payload

    next()
  } catch (error) {
    // Log the error internally for debugging, but don't leak details to the client
    if (process.env.NODE_ENV === 'development') {
      console.warn('JWT Verification failed:', error.code || error.message)
    }

    return response.status(401).json({
      message: 'Invalid or expired session. Please log in again.',
      // Only send error code in development to avoid fingerprinting
      ...(process.env.NODE_ENV === 'development' && { reason: error.code }),
    })
  }
}

export default authentication
