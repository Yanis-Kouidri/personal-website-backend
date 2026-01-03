import fs from 'node:fs/promises'
import path from 'node:path'

import {
  DOCUMENTATION_DIRECTORY,
  getSafeUserPath,
  listFilesAndDirectories,
  verifyPath,
} from '../utils/file-system-interaction.js'

/**
 * GET /api/docs
 * Publicly lists all files and directories in the documentation root.
 */
export const getAllDocumentation = async (_request, response) => {
  try {
    // Ensure directory exists asynchronously
    try {
      await fs.access(DOCUMENTATION_DIRECTORY)
    } catch {
      await fs.mkdir(DOCUMENTATION_DIRECTORY, { recursive: true })
    }

    const result = [
      {
        type: 'directory',
        name: '/',
        path: '',
        // await is now required as the utility is async
        contents: await listFilesAndDirectories(DOCUMENTATION_DIRECTORY),
      },
    ]

    return response.status(200).json(result)
  } catch (error) {
    console.error('Failed to read documentation directory:', error)
    return response.status(500).json({
      error: 'An error occurred while fetching documentation.',
    })
  }
}

/**
 * POST /api/docs
 * Handles file upload (Multer logic is handled in routes).
 */
export const addOneDocument = (_request, response) => {
  return response.status(201).json({ message: 'File uploaded successfully' })
}

/**
 * POST /api/docs/folder
 * Creates a new directory safely.
 */
export const newFolder = async (request, response) => {
  const { folderName, folderPath } = request.body
  const userFolderPath = path.join(folderPath || '', folderName)
  const newFolderPath = getSafeUserPath(userFolderPath)

  try {
    await fs.access(newFolderPath)
    // If access succeeds, the folder already exists
    return response.status(409).json({ message: 'Folder already exists' })
  } catch (_error) {
    // If access fails, the folder doesn't exist, proceed to create
    try {
      await fs.mkdir(newFolderPath, { recursive: false })
      return response
        .status(201)
        .json({ message: 'Folder created successfully' })
    } catch (createError) {
      console.error('Error creating folder:', createError)
      return response.status(500).json({ message: 'Internal server error' })
    }
  }
}

/**
 * DELETE /api/docs
 * Deletes a file or an empty directory.
 */
export const deleteItem = async (request, response) => {
  const { path: itemPath } = request.body
  const normalizedPath = getSafeUserPath(itemPath)

  try {
    const stat = await fs.stat(normalizedPath)

    if (stat.isFile()) {
      await fs.unlink(normalizedPath)
      return response.status(200).json({ message: 'File successfully deleted' })
    }

    if (stat.isDirectory()) {
      const contents = await fs.readdir(normalizedPath)
      if (contents.length > 0) {
        return response.status(400).json({ message: 'Folder is not empty' })
      }
      await fs.rmdir(normalizedPath)
      return response
        .status(200)
        .json({ message: 'Folder successfully deleted' })
    }

    return response.status(400).json({ message: 'Invalid item type' })
  } catch (error) {
    if (error.code === 'ENOENT') {
      return response.status(404).json({ message: 'Item does not exist' })
    }
    console.error('Error deleting item:', error)
    return response.status(500).json({ message: 'Internal server error' })
  }
}

/**
 * PATCH /api/docs/rename
 * Renames a file or folder within the same parent directory.
 */
export const renameItem = async (request, response) => {
  const { itemPath, newName } = request.body

  // Note: Basic character validation should be handled by your Zod middleware
  const normalizedPath = getSafeUserPath(itemPath)

  try {
    const stat = await fs.stat(normalizedPath)
    const itemType = stat.isFile() ? 'File' : 'Folder'

    const parentDirectory = path.dirname(normalizedPath)
    const newPath = path.join(parentDirectory, newName)
    const normalizeNewPath = verifyPath(newPath)

    // Check if the destination name is already taken
    try {
      await fs.access(normalizeNewPath)
      return response.status(409).json({ message: 'New name already exists' })
    } catch {
      // Destination is available
      await fs.rename(normalizedPath, normalizeNewPath)
      return response.status(200).json({
        message: `${itemType} successfully renamed`,
      })
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      return response.status(404).json({ message: 'Item does not exist' })
    }
    console.error('Error renaming item:', error)
    return response.status(500).json({ message: 'Internal server error' })
  }
}
