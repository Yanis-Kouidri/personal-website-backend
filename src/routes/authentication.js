import express from 'express'
import * as authenticationControllers from '../controllers/authentication.js'
import authentication from '../middlewares/authentication.js'
import { loginLimiter, tokenVerifLimiter } from '../middlewares/rate-limiter.js'
import { validateBody } from '../middlewares/validate-body.js'
import { loginSchema, signupSchema } from '../schemas/auth-schemas.js'

const router = express.Router()

/**
 * Public routes with rate limiting and body validation
 */
router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  authenticationControllers.login,
)

router.post(
  '/signup',
  loginLimiter, // Consider a stricter 'signupLimiter' if you open registration publicly
  validateBody(signupSchema),
  authenticationControllers.signup,
)

/**
 * Authenticated routes
 */
router.get(
  '/me',
  tokenVerifLimiter,
  authentication,
  authenticationControllers.me,
)

/**
 * Use POST for logout to prevent accidental pre-fetching or CSRF logouts
 */
router.post('/logout', authentication, authenticationControllers.logout)

export default router
