import fs from 'node:fs'
import path from 'node:path'

const dirname = import.meta.dirname
export const DOCUMENTATION_DIRECTORY = path.join(dirname, '../../data/docs')

export const getSafeUserPath = (userPath) => {
  const fullPath = path.join(DOCUMENTATION_DIRECTORY, userPath)
  return verifyPath(fullPath)
}

export const verifyPath = (userPath) => {
  const resolvedPath = path.resolve(userPath)
  if (!resolvedPath.startsWith(DOCUMENTATION_DIRECTORY)) {
    throw new Error('Invalid path')
  }
  if (path.basename(userPath).startsWith('.')) {
    throw new Error('Access to hidden files is forbidden')
  }

  return resolvedPath
}

export const listFilesAndDirectories = (directory) => {
  const result = []
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
