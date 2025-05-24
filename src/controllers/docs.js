import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const storageFolder = '../../data/docs'

export const getAllDocs = (req, res) => {
  const docsDir = path.join(__dirname, storageFolder)

  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true })
  }

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
    return res
      .status(500)
      .json({ error: 'Erreur lors de la lecture des documents.' })
  }
}

export const addOneDoc = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file attached' })
    }
    res.status(200).json({ message: 'File uploaded !' })
  } catch (error) {
    return res.status(500).json({ message: 'Error: ' + error })
  }
}

export const newFolder = (req, res) => {
  const { folderName, folderPath } = req.body

  if (!folderName) {
    return res.status(400).json({ message: 'Folder name is required' })
  }

  let newFolderPath = folderPath
    ? path.join(__dirname, storageFolder, folderPath, folderName)
    : path.join(__dirname, storageFolder, folderName)

  if (fs.existsSync(newFolderPath)) {
    return res.status(400).json({ message: 'Folder already exists' })
  }

  try {
    fs.mkdirSync(newFolderPath)
    return res.status(200).json({ message: 'Folder created successfully' })
  } catch (error) {
    console.error('Error creating folder: ', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteFile = (req, res) => {
  const { filePath } = req.body

  if (!filePath) {
    return res.status(400).json({ message: 'File path is required' })
  }

  const baseDir = path.join(__dirname, storageFolder) // root docs folder
  const targetPath = path.join(baseDir, filePath)
  const normalizedPath = path.normalize(targetPath)

  if (!normalizedPath.startsWith(baseDir)) {
    return res.status(403).json({ message: 'Unauthorized path' })
  }

  if (!fs.existsSync(normalizedPath)) {
    return res.status(404).json({ message: 'File does not exist' })
  }

  const stat = fs.statSync(normalizedPath)
  if (!stat.isFile()) {
    return res.status(400).json({ message: 'Target is not a file' })
  }

  try {
    fs.unlinkSync(normalizedPath)
    return res.status(200).json({ message: 'File successfully deleted' })
  } catch (error) {
    console.error('Error deleting file: ', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteItem = (req, res) => {
  const { path: itemPath } = req.body

  if (!itemPath) {
    return res.status(400).json({ message: 'Path is required' })
  }

  const baseDir = path.join(__dirname, storageFolder)
  const targetPath = path.join(baseDir, itemPath)
  const normalizedPath = path.normalize(targetPath)

  if (!normalizedPath.startsWith(baseDir)) {
    return res.status(403).json({ message: 'Unauthorized path' })
  }

  if (!fs.existsSync(normalizedPath)) {
    return res.status(404).json({ message: 'Item does not exist' })
  }

  const stat = fs.statSync(normalizedPath)

  if (stat.isFile()) {
    try {
      fs.unlinkSync(normalizedPath)
      return res.status(200).json({ message: 'File successfully deleted' })
    } catch (error) {
      console.error('Error deleting file: ', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  } else if (stat.isDirectory()) {
    // Check if folder is empty
    const contents = fs.readdirSync(normalizedPath)
    if (contents.length > 0) {
      return res.status(400).json({ message: 'Folder is not empty' })
    }

    try {
      fs.rmdirSync(normalizedPath)
      return res.status(200).json({ message: 'Folder successfully deleted' })
    } catch (error) {
      console.error('Error deleting folder: ', error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    return res.status(400).json({ message: 'Invalid item type' })
  }
}

export const renameItem = (req, res) => {
  const { itemPath, newName } = req.body

  if (!newName) {
    return res.status(400).json({ message: 'Name is required' })
  }
  if (itemPath === null) {
    return res.status(400).json({ message: 'Item path is required' })
  }
  if (!itemPath) {
    return res.status(400).json({ message: "You can't rename root" })
  }
  if (/[/\\]/.test(newName)) {
    return res
      .status(400)
      .json({ message: 'New name contains invalid characters' })
  }

  const baseDir = path.join(__dirname, storageFolder)
  const targetPath = path.join(baseDir, itemPath)
  const normalizedPath = path.normalize(targetPath)

  if (!normalizedPath.startsWith(baseDir)) {
    return res.status(403).json({ message: 'Unauthorized path' })
  }

  if (!fs.existsSync(normalizedPath)) {
    return res.status(404).json({ message: 'Item does not exist' })
  }

  const stat = fs.statSync(normalizedPath)
  const itemType = stat.isFile() ? 'file' : stat.isDirectory() ? 'folder' : null

  if (!itemType) {
    return res.status(400).json({ message: 'Invalid item type' })
  }

  const parentDir = path.dirname(normalizedPath)
  const newPath = path.join(parentDir, newName)
  const normalizeNewPath = path.normalize(newPath)

  if (fs.existsSync(normalizeNewPath)) {
    return res.status(400).json({ message: 'New name already exists' })
  }

  try {
    fs.renameSync(normalizedPath, normalizeNewPath)
    return res.status(200).json({
      message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} successfully renamed`,
    })
  } catch (error) {
    console.error('Erro renaming item: ', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
