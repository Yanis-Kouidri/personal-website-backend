import fs from 'node:fs/promises'
import path from 'node:path'

// Ensure the root directory is absolute and normalized
const dirname = import.meta.dirname
export const DOCUMENTATION_DIRECTORY = path.resolve(dirname, '../../data/docs')

/**
 * Validates and returns a safe absolute path within the documentation directory.
 * @param {string} userPath - The relative path provided by the user.
 * @returns {string} The resolved absolute path.
 */
export const getSafeUserPath = (userPath) => {
  // 1. Join the root with the user input
  const targetPath = path.join(DOCUMENTATION_DIRECTORY, userPath)

  // 2. Resolve to an absolute path to eliminate '..' or '.' segments
  const resolvedPath = path.resolve(targetPath)

  // 3. Security: Check if the resolved path is still inside the intended root
  // We use path.sep to prevent partial matches (e.g., /docs-secret/ vs /docs/)
  if (
    !resolvedPath.startsWith(DOCUMENTATION_DIRECTORY + path.sep) &&
    resolvedPath !== DOCUMENTATION_DIRECTORY
  ) {
    throw new Error('Invalid path: Access denied')
  }

  // 4. Security: Prevent access to hidden files (e.g., .env, .git)
  if (path.basename(resolvedPath).startsWith('.')) {
    throw new Error('Access to hidden files is forbidden')
  }

  return resolvedPath
}

/**
 * Recursively lists files and directories.
 * Optimized for Node 24 using Dirent for better performance.
 * @param {string} directory - The absolute path to scan.
 * @returns {Promise<Array>} A promise resolving to the tree structure.
 */
export const listFilesAndDirectories = async (directory) => {
  const result = []

  try {
    // withFileTypes: true avoids extra fs.stat calls by returning Dirent objects
    const items = await fs.readdir(directory, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(directory, item.name)
      const relativePath = path.relative(DOCUMENTATION_DIRECTORY, fullPath)

      // Skip hidden files/folders at any level
      if (item.name.startsWith('.')) continue

      if (item.isDirectory()) {
        result.push({
          type: 'directory',
          name: item.name,
          path: relativePath,
          contents: await listFilesAndDirectories(fullPath), // Recursive call
        })
      } else if (item.isFile()) {
        result.push({
          type: 'file',
          name: item.name,
          path: relativePath,
        })
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${directory}:`, error)
    return [] // Return empty array on error to prevent breaking the whole tree
  }

  return result
}

/**
 * Verifies if a path is safe (alias for consistency in controllers).
 */
export const verifyPath = (userPath) => {
  return getSafeUserPath(userPath)
}
