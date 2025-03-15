import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const storageFolder = '../../data/docs'

export const getAllDocs = (req, res) => {
  const docsDir = path.join(__dirname, storageFolder)

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
    res.status(500).json({
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

export const newFolder = (req, res) => {
  const { folderName } = req.body

  if (!folderName) {
    res.status(400).json({ message: 'File name required' })
  }

  const newFolder = path.join(__dirname, storageFolder, folderName)
  if (!fs.existsSync(newFolder)) {
    fs.mkdirSync(newFolder)
    res.status(200).json({ message: 'Folder created' })
  } else {
    res.status(400).json({ message: 'Folder already exist' })
  }
}
