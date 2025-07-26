import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DOCUMENTATION_DIRECTORY = path.join(__dirname, '../../data/docs')

function getSafeUserPath(userPath) {
  const fullPath = path.join(DOCUMENTATION_DIRECTORY, userPath)
  const resolvedPath = path.resolve(fullPath)
  if (!resolvedPath.startsWith(DOCUMENTATION_DIRECTORY)) {
    throw new Error('Invalid path')
  }
  if (path.basename(userPath).startsWith('.')) {
    throw new Error('Access to hidden files is forbidden')
  }

  return resolvedPath
}

export const getAllDocumentation = (request, response) => {
  if (!fs.existsSync(DOCUMENTATION_DIRECTORY)) {
    fs.mkdirSync(DOCUMENTATION_DIRECTORY, { recursive: true })
  }

  const listFilesAndDirectories = (directory) => {
    let result = []
    const items = fs.readdirSync(directory)

    for (const item of items) {
      const fullPath = path.join(directory, item)
      const relativePath = path.relative(DOCUMENTATION_DIRECTORY, fullPath)
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
    }

    return result
  }

  try {
    const result = [
      {
        type: 'directory',
        name: '/',
        path: '',
        contents: listFilesAndDirectories(DOCUMENTATION_DIRECTORY),
      },
    ]

    response.json(result)
  } catch (error) {
    console.error('Erreur lors de la lecture des fichiers :', error)
    return response
      .status(500)
      .json({ error: 'Erreur lors de la lecture des documents.' })
  }
}

export const addOneDocument = (request, response) => {
  try {
    if (!request.file) {
      return response.status(400).json({ message: 'No file attached' })
    }
    response.status(200).json({ message: 'File uploaded !' })
  } catch (error) {
    return response.status(500).json({ message: 'Error: ' + error })
  }
}

export const newFolder = (request, response) => {
  const { folderName, folderPath = '' } = request.body

  if (!folderName) {
    return response.status(400).json({ message: 'Folder name is required' })
  }
  const userFolderPath = path.join(folderPath, folderName)

  let newFolderPath = getSafeUserPath(userFolderPath)

  if (fs.existsSync(newFolderPath)) {
    return response.status(400).json({ message: 'Folder already exists' })
  }

  try {
    fs.mkdirSync(newFolderPath)
    return response.status(200).json({ message: 'Folder created successfully' })
  } catch (error) {
    console.error('Error creating folder:', error)
    return response.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteFile = (request, response) => {
  const { filePath } = request.body

  if (!filePath) {
    return response.status(400).json({ message: 'File path is required' })
  }

  const targetPath = path.join(DOCUMENTATION_DIRECTORY, filePath)
  const normalizedPath = path.normalize(targetPath)

  if (!normalizedPath.startsWith(DOCUMENTATION_DIRECTORY)) {
    return response.status(403).json({ message: 'Unauthorized path' })
  }

  if (!fs.existsSync(normalizedPath)) {
    return response.status(404).json({ message: 'File does not exist' })
  }

  const stat = fs.statSync(normalizedPath)
  if (!stat.isFile()) {
    return response.status(400).json({ message: 'Target is not a file' })
  }

  try {
    fs.unlinkSync(normalizedPath)
    return response.status(200).json({ message: 'File successfully deleted' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return response.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteItem = (request, response) => {
  const { path: itemPath } = request.body

  if (!itemPath) {
    return response.status(400).json({ message: 'Path is required' })
  }

  const targetPath = path.join(DOCUMENTATION_DIRECTORY, itemPath)
  const normalizedPath = path.normalize(targetPath)

  if (!normalizedPath.startsWith(DOCUMENTATION_DIRECTORY)) {
    return response.status(403).json({ message: 'Unauthorized path' })
  }

  if (!fs.existsSync(normalizedPath)) {
    return response.status(404).json({ message: 'Item does not exist' })
  }

  const stat = fs.statSync(normalizedPath)

  if (stat.isFile()) {
    try {
      fs.unlinkSync(normalizedPath)
      return response.status(200).json({ message: 'File successfully deleted' })
    } catch (error) {
      console.error('Error deleting file:', error)
      return response.status(500).json({ message: 'Internal server error' })
    }
  } else if (stat.isDirectory()) {
    // Check if folder is empty
    const contents = fs.readdirSync(normalizedPath)
    if (contents.length > 0) {
      return response.status(400).json({ message: 'Folder is not empty' })
    }

    try {
      fs.rmdirSync(normalizedPath)
      return response
        .status(200)
        .json({ message: 'Folder successfully deleted' })
    } catch (error) {
      console.error('Error deleting folder:', error)
      return response.status(500).json({ message: 'Internal server error' })
    }
  } else {
    return response.status(400).json({ message: 'Invalid item type' })
  }
}

export const renameItem = (request, response) => {
  const { itemPath, newName } = request.body

  if (!newName) {
    return response.status(400).json({ message: 'Name is required' })
  }
  if (itemPath === null) {
    return response.status(400).json({ message: 'Item path is required' })
  }
  if (!itemPath) {
    return response.status(400).json({ message: "You can't rename root" })
  }
  if (/[/\\]/.test(newName)) {
    return response
      .status(400)
      .json({ message: 'New name contains invalid characters' })
  }

  const targetPath = path.join(DOCUMENTATION_DIRECTORY, itemPath)
  const normalizedPath = path.normalize(targetPath)

  if (!normalizedPath.startsWith(DOCUMENTATION_DIRECTORY)) {
    return response.status(403).json({ message: 'Unauthorized path' })
  }

  if (!fs.existsSync(normalizedPath)) {
    return response.status(404).json({ message: 'Item does not exist' })
  }

  const stat = fs.statSync(normalizedPath)
  let itemType
  if (stat.isFile()) {
    itemType = 'file'
  } else if (stat.isDirectory()) {
    itemType = 'folder'
  } else {
    itemType = undefined
  }

  if (!itemType) {
    return response.status(400).json({ message: 'Invalid item type' })
  }

  const parentDirectory = path.dirname(normalizedPath)
  const newPath = path.join(parentDirectory, newName)
  const normalizeNewPath = path.normalize(newPath)

  if (fs.existsSync(normalizeNewPath)) {
    return response.status(400).json({ message: 'New name already exists' })
  }

  try {
    fs.renameSync(normalizedPath, normalizeNewPath)
    return response.status(200).json({
      message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} successfully renamed`,
    })
  } catch (error) {
    console.error('Error renaming item:', error)
    return response.status(500).json({ message: 'Internal server error' })
  }
}
