import express from 'express'
import * as docsCtrl from '../controllers/docs.js'
import authentication from '../middlewares/authentication.js'
import { docsUpload, errorHandler } from '../middlewares/multer.js'

const router = express.Router()

router.get('/', docsCtrl.getAllDocs)

router.post(
  '/',
  authentication,
  docsUpload.single('file'),
  errorHandler,
  docsCtrl.addOneDoc
)

router.post('/newfolder', authentication, docsCtrl.newFolder)

router.delete('/', authentication, docsCtrl.deleteItem)

export default router
