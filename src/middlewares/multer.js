import fs from 'node:fs'
import path from 'node:path'

import multer from 'multer'

const storage = multer.diskStorage({
  destination: function (request, file, callback) {
    const requestedSubfolder = request.query.path || ''

    const sanitizedPath = path
      .normalize(requestedSubfolder)
      .replace(/^(\.\.(\/|\\|$))+/, '')

    if (sanitizedPath.includes('..') || path.isAbsolute(sanitizedPath)) {
      return callback(new Error('Invalid folder path'))
    }
    const basePath = path.join('data', 'docs')
    const fullPath = path.join(basePath, sanitizedPath)

    if (!fullPath.startsWith(basePath)) {
      return callback(new Error('Invalid folder path 2'))
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
      return callback(new Error('Specified folder does not exist'))
    }

    callback(undefined, fullPath)
  },
  filename: function (request, file, callback) {
    callback(undefined, decodeURIComponent(file.originalname))
  },
})

const documentationFileFilter = (request, file, callback) => {
  const filetypes = /pdf|msword|doc|docx|pptx|ptt|zip/
  const mimetypeMatch = filetypes.test(file.mimetype)
  const extnameMatch = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  )

  if (mimetypeMatch && extnameMatch) {
    return callback(undefined, true)
  }
  callback(new Error('File type not supported'))
}

export const errorHandler = (error, request, response, next) => {
  if (error) {
    return response.status(400).json({ message: error.message })
  }
  next()
}

export const documentUpload = multer({
  storage: storage,
  fileFilter: documentationFileFilter,
  limits: {
    fileSize: 8_000_000, // 8MB
  },
})
