import express from 'express'
import * as docsCtrl from '../controllers/docs.js'

const router = express.Router()

router.get('/', docsCtrl.getAllDocs)

router.post('/', docsCtrl.addOneDoc)

export default router
