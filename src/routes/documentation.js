import express from 'express'

import * as documentationController from '../controllers/documentation.js'
import authentication from '../middlewares/authentication.js'
import {
  documentUpload as documentationUpload,
  errorHandler,
} from '../middlewares/multer.js'

const router = express.Router()

router.get('/', documentationController.getAllDocumentation)

router.post(
  '/',
  authentication,
  documentationUpload.single('file'),
  errorHandler,
  documentationController.addOneDocument
)

router.post('/newfolder', authentication, documentationController.newFolder)

router.delete('/', authentication, documentationController.deleteItem)

router.patch('/rename', authentication, documentationController.renameItem)

export default router
