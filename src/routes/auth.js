import express from 'express'
import * as authCtrl from '../controllers/auth.js'
import { loginLimiter, tokenVerifLimiter } from '../middlewares/rateLimiter.js'
import authentication from '../middlewares/authentication.js'

const router = express.Router()

router.post('/login', loginLimiter, authCtrl.login)
router.post('/signup', loginLimiter, authCtrl.signup)
router.get('/me', tokenVerifLimiter, authentication, authCtrl.me)
router.get('/logout', authCtrl.logout)

export default router
