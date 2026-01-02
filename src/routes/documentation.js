import express from 'express'

import * as documentationController from '../controllers/documentation.js'
import authentication from '../middlewares/authentication.js'
import {
  documentUpload as documentationUpload,
  errorHandler,
} from '../middlewares/multer.js'
import { validateBody } from '../middlewares/validate-body.js'
import {
  deleteItemSchema,
  newFolderSchema,
  renameItemSchema,
} from '../schemas/documentation-schemas.js'

const router = express.Router()

router.get('/', documentationController.getAllDocumentation)

router.post(
  '/',
  authentication,
  documentationUpload.single('file'),
  errorHandler,
  documentationController.addOneDocument,
)

router.post(
  '/newfolder',
  authentication,
  validateBody(newFolderSchema),
  documentationController.newFolder,
)

router.delete(
  '/',
  authentication,
  validateBody(deleteItemSchema),
  documentationController.deleteItem,
)

router.patch(
  '/rename',
  authentication,
  validateBody(renameItemSchema),
  documentationController.renameItem,
)

export default router
