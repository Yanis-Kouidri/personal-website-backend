import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const getAllDocs = (req, res) => {
  const docsDir = path.join(__dirname, '../../data/docs')

  fs.readdir(docsDir, (err, files) => {
    if (err) {
      return res
        .status(500)
        .json({ message: 'Erreur lors de la lecture du dossier' })
    }
    res.json(files)
  })
}

export const addOneDoc = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file attached' })
    }
    res.status(200).json({ message: 'File uploaded !' })
  } catch (error) {
    res.status(500).json({ message: 'Error: ' + error })
  }
}
