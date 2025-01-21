import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'data/docs/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
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
