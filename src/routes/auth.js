import express from 'express'

import * as authCtrl from '../controllers/auth.js'
import authentication from '../middlewares/authentication.js'
import { loginLimiter, tokenVerifLimiter } from '../middlewares/rate-limiter.js'
import { validateBody } from '../middlewares/validate-body.js'
import { loginSchema, signupSchema } from '../schemas/auth-schemas.js'

const router = express.Router()

router.post('/login', loginLimiter, validateBody(loginSchema), authCtrl.login)
router.post(
  '/signup',
  loginLimiter,
  validateBody(signupSchema),
  authCtrl.signup
)
router.get('/me', tokenVerifLimiter, authentication, authCtrl.me)
router.get('/logout', authCtrl.logout)

export default router
