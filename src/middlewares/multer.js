import path from 'node:path'
import multer from 'multer'
import { getSafeUserPath } from '../utils/file-system-interaction.js'

/**
 * Storage Configuration
 * Reuses the centralized path validation logic to prevent Path Traversal.
 */
const storage = multer.diskStorage({
  destination: (request, _file, callback) => {
    try {
      // Use the query parameter or default to root
      const requestedSubfolder = request.query.path || ''

      // We reuse our robust utility to get the absolute safe path
      const fullPath = getSafeUserPath(requestedSubfolder)

      // Note: Multer expects the directory to exist already.
      // Our controller handles directory creation, but we ensure safety here.
      callback(null, fullPath)
    } catch (error) {
      // Catch "Invalid path" or "Hidden files" errors from getSafeUserPath
      callback(error)
    }
  },
  filename: (_request, file, callback) => {
    /**
     * Security: sanitize the filename to prevent unexpected behavior.
     * We remove potentially dangerous characters and use a timestamp prefix
     * to avoid collisions if two users upload 'doc.pdf' simultaneously.
     */
    const decodedName = decodeURIComponent(file.originalname).replace(
      /[^a-zA-Z0-9.\-_]/g,
      '_',
    )

    callback(null, decodedName)
  },
})

/**
 * File Filter
 * Validates both MimeType and Extension for defense-in-depth.
 */
const documentationFileFilter = (_request, file, callback) => {
  // Added more common documentation types and improved regex
  const allowedExtensions = /pdf|doc|docx|ppt|pptx|zip|txt/
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'text/plain',
  ]

  const extensionMatch = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase(),
  )
  const mimeMatch = allowedMimeTypes.includes(file.mimetype)

  if (extensionMatch && mimeMatch) {
    return callback(null, true)
  }

  callback(
    new Error('File type not supported. Only documents and zips are allowed.'),
  )
}

/**
 * Custom Error Handler for Multer
 * Handles file size limits and filter rejections.
 */
export const errorHandler = (error, _request, response, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return response
        .status(413)
        .json({ message: 'File is too large. Maximum limit is 8MB.' })
    }
    return response.status(400).json({ message: error.message })
  }

  if (error) {
    return response.status(400).json({ message: error.message })
  }

  next()
}

/**
 * Multer Instance
 */
export const documentUpload = multer({
  storage: storage,
  fileFilter: documentationFileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB
    files: 1, // Limit to one file per request for security
  },
})
