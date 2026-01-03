import fs from 'node:fs/promises'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  DOCUMENTATION_DIRECTORY,
  getSafeUserPath,
  listFilesAndDirectories,
} from '../../src/utils/file-system-interaction'

// Mocking node:fs/promises for async operations
vi.mock('node:fs/promises')

describe('getSafeUserPath', () => {
  it('should return the correct resolved path for a valid user path', () => {
    const userPath = 'some/valid/path'
    const expectedPath = path.resolve(DOCUMENTATION_DIRECTORY, userPath)

    expect(getSafeUserPath(userPath)).toBe(expectedPath)
  })

  it('should throw an error for a path that tries to access outside the documentation directory', () => {
    const userPath = '../../outside/path'
    // Updated error message to match the new implementation
    expect(() => getSafeUserPath(userPath)).toThrow(
      'Invalid path: Access denied',
    )
  })

  it('should throw an error for a path that tries to access a hidden file', () => {
    const userPath = 'some/.hiddenfile'
    expect(() => getSafeUserPath(userPath)).toThrow(
      'Access to hidden files is forbidden',
    )
  })
})

describe('listFilesAndDirectories', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  /**
   * Helper to create mock Dirent objects as used by readdir({ withFileTypes: true })
   */
  const createMockDirent = (name, isDir = false) => ({
    name,
    isDirectory: () => isDir,
    isFile: () => !isDir,
  })

  it('should list a single file in the directory', async () => {
    fs.readdir.mockResolvedValue([createMockDirent('file1.txt', false)])

    const result = await listFilesAndDirectories(DOCUMENTATION_DIRECTORY)

    expect(result).toEqual([
      {
        type: 'file',
        name: 'file1.txt',
        path: 'file1.txt',
      },
    ])
  })

  it('should list a directory and its empty contents', async () => {
    // First call for root, second call for the empty folder
    fs.readdir
      .mockResolvedValueOnce([createMockDirent('folder', true)])
      .mockResolvedValueOnce([])

    const result = await listFilesAndDirectories(DOCUMENTATION_DIRECTORY)

    expect(result).toEqual([
      {
        type: 'directory',
        name: 'folder',
        path: 'folder',
        contents: [],
      },
    ])
  })

  it('should list nested files and directories recursively', async () => {
    fs.readdir
      .mockResolvedValueOnce([createMockDirent('folder', true)]) // root level
      .mockResolvedValueOnce([createMockDirent('nested.txt', false)]) // inside folder

    const result = await listFilesAndDirectories(DOCUMENTATION_DIRECTORY)

    expect(result).toEqual([
      {
        type: 'directory',
        name: 'folder',
        path: 'folder',
        contents: [
          {
            type: 'file',
            name: 'nested.txt',
            path: path.join('folder', 'nested.txt'),
          },
        ],
      },
    ])
  })

  it('should skip hidden files and directories', async () => {
    fs.readdir.mockResolvedValue([
      createMockDirent('.git', true),
      createMockDirent('visible.txt', false),
      createMockDirent('.env', false),
    ])

    const result = await listFilesAndDirectories(DOCUMENTATION_DIRECTORY)

    // Should only contain the visible file
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('visible.txt')
  })

  it('should return an empty array if directory reading fails', async () => {
    fs.readdir.mockRejectedValue(new Error('FS Error'))

    const result = await listFilesAndDirectories(DOCUMENTATION_DIRECTORY)

    expect(result).toEqual([])
  })
})
