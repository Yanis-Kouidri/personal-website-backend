import express from 'express'

import * as authenticationControllers from '../controllers/authentication.js'
import authentication from '../middlewares/authentication.js'
import { loginLimiter, tokenVerifLimiter } from '../middlewares/rate-limiter.js'
import { validateBody } from '../middlewares/validate-body.js'
import { loginSchema, signupSchema } from '../schemas/auth-schemas.js'

const router = express.Router()

router.post(
  '/login',
  loginLimiter,
  validateBody(loginSchema),
  authenticationControllers.login
)
router.post(
  '/signup',
  loginLimiter,
  validateBody(signupSchema),
  authenticationControllers.signup
)
router.get(
  '/me',
  tokenVerifLimiter,
  authentication,
  authenticationControllers.me
)
router.get('/logout', authenticationControllers.logout)

export default router
