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

/**
 * @route   GET /api/docs
 * @desc    List files and folders
 * @access  Public - No authentication required
 */
router.get('/', documentationController.getAllDocumentation)

/**
 * PROTECTED ROUTES
 * All routes defined below this middleware require a valid JWT.
 */
router.use(authentication)

/**
 * @route   POST /api/docs
 * @desc    Upload a single file
 * @access  Private
 */
router.post(
  '/',
  documentationUpload.single('file'),
  errorHandler, // Handles file size/type errors before reaching the controller
  documentationController.addOneDocument,
)

/**
 * @route   POST /api/docs/folder
 * @desc    Create a new directory
 * @access  Private
 */
router.post(
  '/folder',
  validateBody(newFolderSchema),
  documentationController.newFolder,
)

/**
 * @route   DELETE /api/docs
 * @desc    Delete a file or an empty directory
 * @access  Private
 */
router.delete(
  '/',
  validateBody(deleteItemSchema),
  documentationController.deleteItem,
)

/**
 * @route   PATCH /api/docs/rename
 * @desc    Rename an existing item
 * @access  Private
 */
router.patch(
  '/rename',
  validateBody(renameItemSchema),
  documentationController.renameItem,
)

export default router
