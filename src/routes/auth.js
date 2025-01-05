import express from 'express'
import * as authCtrl from '../controllers/auth.js'

const router = express.Router()

router.post('/login', authCtrl.login)

export default router
