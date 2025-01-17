import express from 'express'
import * as docsCtrl from '../controllers/docs.js'
import authentication from '../middlewares/authentication.js'
import upload from '../middlewares/multer.js'
const router = express.Router()

router.get('/', docsCtrl.getAllDocs)

router.post('/', authentication, upload.single("file"), docsCtrl.addOneDoc)

export default router
