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
    const result = [
      {
        type: 'directory',
        name: '/',
        path: '',
        contents: listFilesAndDirectories(docsDir),
      },
    ]

    res.json(result)
  } catch (error) {
    console.error('Erreur lors de la lecture des fichiers :', error)
    res.status(500).json({ error: 'Erreur lors de la lecture des documents.' })
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
  const { folderName, folderPath } = req.body

  if (!folderName) {
    res.status(400).json({ message: 'File name required' })
  }

  if (!folderPath) {
    res.status(400).json({ message: 'File path required' })
  }

  const newFolder = path.join(__dirname, storageFolder, folderPath, folderName)
  if (!fs.existsSync(newFolder)) {
    fs.mkdirSync(newFolder)
    res.status(200).json({ message: 'Folder created' })
  } else {
    res.status(400).json({ message: 'Folder already exist' })
  }
}
