import express from 'express'
import * as authCtrl from '../controllers/auth.js'
import loginLimiter from '../middlewares/rateLimiter.js'

const router = express.Router()

router.post('/login', loginLimiter, authCtrl.login)
router.post('/signup', loginLimiter, authCtrl.signup)

export default router
