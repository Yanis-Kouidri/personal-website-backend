import fs from 'node:fs'
import path from 'node:path'

import {
  DOCUMENTATION_DIRECTORY,
  listFilesAndDirectories,
  getSafeUserPath,
  verifyPath,
} from '../utils/file-system-interaction.js'

export const getAllDocumentation = (request, response) => {
  if (!fs.existsSync(DOCUMENTATION_DIRECTORY)) {
    fs.mkdirSync(DOCUMENTATION_DIRECTORY, { recursive: true })
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
  response.status(200).json({ message: 'File uploaded !' })
}

export const newFolder = (request, response) => {
  const { folderName, folderPath } = request.body

  const userFolderPath = path.join(folderPath, folderName)

  let newFolderPath = getSafeUserPath(userFolderPath)

  if (fs.existsSync(newFolderPath)) {
    return response.status(401).json({ message: 'Folder already exists' })
  }

  try {
    fs.mkdirSync(newFolderPath)
    return response.status(200).json({ message: 'Folder created successfully' })
  } catch (error) {
    console.error('Error creating folder:', error)
    return response.status(500).json({ message: 'Internal server error' })
  }
}

export const deleteItem = (request, response) => {
  const { path: itemPath } = request.body

  const normalizedPath = getSafeUserPath(itemPath)

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
      return response.status(401).json({ message: 'Folder is not empty' })
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

  if (/[/\\]/.test(newName)) {
    return response
      .status(400)
      .json({ message: 'New name contains invalid characters' })
  }
  const normalizedPath = getSafeUserPath(itemPath)

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
  const normalizeNewPath = verifyPath(newPath)

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
