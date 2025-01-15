import express from 'express'
import * as docsCtrl from '../controllers/docs.js'
import authentication from '../middlewares/authentication.js'

const router = express.Router()

router.get('/', docsCtrl.getAllDocs)

router.post('/', authentication, docsCtrl.addOneDoc)

export default router
