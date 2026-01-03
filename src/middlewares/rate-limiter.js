import { rateLimit } from 'express-rate-limit'

/**
 * Generic factory to create rate limiter instances.
 * * @param {number} max - Maximum number of requests.
 * @param {number} minutes - Window size in minutes.
 * @param {string} message - Custom error message.
 */
const createLimiter = (max, minutes, message) => {
  return rateLimit({
    windowMs: minutes * 60 * 1000,
    limit: max, // Replaces 'max' in newer versions of express-rate-limit
    message: {
      status: 429,
      error: 'Too Many Requests',
      message: message,
    },
    standardHeaders: 'draft-7', // Returns combined RateLimit headers
    legacyHeaders: false, // Disables X-RateLimit-* headers
    // Use MemoryStore by default, but ready for RedisStore if you scale
    skipSuccessfulRequests: false,
  })
}

/**
 * Strict limiter for authentication attempts (Login & Signup).
 * Prevents brute-force attacks.
 */
export const loginLimiter = createLimiter(
  10,
  15,
  'Too many login attempts. Please try again after 15 minutes.',
)

/**
 * Limiter for session verification.
 * Prevents spamming the /me endpoint.
 */
export const tokenVerifLimiter = createLimiter(
  60,
  1,
  'Too many session checks. Please slow down.',
)

/**
 * General API limiter for all other routes.
 */
export const apiLimiter = createLimiter(100, 15, 'Global rate limit exceeded.')
