import multer from 'multer'
import path from 'path'
import fs from 'fs'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const requestedSubfolder = req.query.path || ''

    const sanitizedPath = path
      .normalize(requestedSubfolder)
      .replace(/^(\.\.(\/|\\|$))+/, '')

    if (sanitizedPath.includes('..') || path.isAbsolute(sanitizedPath)) {
      return cb(new Error('Invalid folder path'))
    }
    const basePath = path.join('data', 'docs')
    const fullPath = path.join(basePath, sanitizedPath)

    if (!fullPath.startsWith(basePath)) {
      return cb(new Error('Invalid folder path 2'))
    }

    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
      return cb(new Error('Specified folder does not exist'))
    }

    cb(null, fullPath)
  },
  filename: function (req, file, cb) {
    cb(null, decodeURIComponent(file.originalname))
  },
})

const docsFileFilter = (req, file, cb) => {
  const filetypes = /pdf|msword|doc|docx|pptx|ptt|zip/
  const mimetypeMatch = filetypes.test(file.mimetype)
  const extnameMatch = filetypes.test(
    path.extname(file.originalname).toLowerCase()
  )

  if (mimetypeMatch && extnameMatch) {
    return cb(null, true)
  }
  cb(new Error('File type not supported'))
}

export const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message })
  } else if (err) {
    return res.status(400).json({ message: err.message })
  }
  next()
}

export const docsUpload = multer({
  storage: storage,
  fileFilter: docsFileFilter,
})
