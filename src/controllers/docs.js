import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const getAllDocs = (req, res) => {
  const docsDir = path.join(__dirname, '../../data/docs')

  const listFilesAndDirectories = (directory) => {
    let result = []
    const items = fs.readdirSync(directory)

    items.forEach((item) => {
      const fullPath = path.join(directory, item)
      const relativePath = path.relative(docsDir, fullPath)
      const stats = fs.statSync(fullPath)

      if (stats.isDirectory()) {
        result.push({
          type: 'directory',
          name: item,
          path: relativePath,
          contents: listFilesAndDirectories(fullPath),
        })
      } else {
        result.push({
          type: 'file',
          name: item,
          path: relativePath,
        })
      }
    })

    return result
  }

  try {
    const filesAndDirectories = listFilesAndDirectories(docsDir)
    res.json(filesAndDirectories)
  } catch (err) {
    res
      .status(500)
      .json({
        message: 'Erreur lors de la lecture du dossier',
        error: err.message,
      })
  }
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
