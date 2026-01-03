import fs from 'node:fs/promises'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  addOneDocument,
  deleteItem,
  getAllDocumentation,
  newFolder,
  renameItem,
} from '../../src/controllers/documentation'
import {
  DOCUMENTATION_DIRECTORY,
  getSafeUserPath,
  listFilesAndDirectories,
  verifyPath,
} from '../../src/utils/file-system-interaction'

// Mocking all external dependencies
vi.mock('node:fs/promises')
// We only mock specific path functions to keep path.join working normally if needed,
// but here we mock it for strict control.
vi.mock('node:path')
vi.mock('../../src/utils/file-system-interaction')

describe('Documentation Controller', () => {
  let mockRequest, mockResponse

  beforeEach(() => {
    vi.clearAllMocks()
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    // Default path.join behavior for internal logic
    path.join.mockImplementation((...args) => args.join('/'))
    path.dirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/'))
  })

  describe('getAllDocumentation', () => {
    it('should return 200 and the file tree', async () => {
      fs.access.mockResolvedValue(undefined) // Directory exists
      const mockTree = [{ type: 'file', name: 'test.pdf', path: 'test.pdf' }]
      listFilesAndDirectories.mockResolvedValue(mockTree)

      await getAllDocumentation(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith([
        {
          type: 'directory',
          name: '/',
          path: '',
          contents: mockTree,
        },
      ])
    })

    it('should create directory if it does not exist', async () => {
      fs.access.mockRejectedValue(new Error()) // Directory missing
      fs.mkdir.mockResolvedValue(undefined)
      listFilesAndDirectories.mockResolvedValue([])

      await getAllDocumentation(mockRequest, mockResponse)

      expect(fs.mkdir).toHaveBeenCalledWith(DOCUMENTATION_DIRECTORY, {
        recursive: true,
      })
      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })

    it('should return 500 on internal error', async () => {
      fs.access.mockRejectedValue(new Error('Fatal'))
      // mkdir fails too
      fs.mkdir.mockRejectedValue(new Error('Fatal'))

      await getAllDocumentation(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'An error occurred while fetching documentation.',
      })
    })
  })

  describe('addOneDocument', () => {
    it('should return 201 on success', () => {
      addOneDocument(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'File uploaded successfully',
      })
    })
  })

  describe('newFolder', () => {
    beforeEach(() => {
      mockRequest = { body: { folderName: 'new-dir', folderPath: 'root' } }
    })

    it('should return 201 when folder is created successfully', async () => {
      getSafeUserPath.mockReturnValue('/safe/root/new-dir')
      fs.access.mockRejectedValue(new Error()) // Folder doesn't exist (good)
      fs.mkdir.mockResolvedValue(undefined)

      await newFolder(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Folder created successfully',
      })
    })

    it('should return 409 if folder already exists', async () => {
      getSafeUserPath.mockReturnValue('/safe/root/new-dir')
      fs.access.mockResolvedValue(undefined) // Folder exists

      await newFolder(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(409)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Folder already exists',
      })
    })
  })

  describe('deleteItem', () => {
    it('should delete a file and return 200', async () => {
      mockRequest = { body: { path: 'file.txt' } }
      getSafeUserPath.mockReturnValue('/safe/file.txt')
      fs.stat.mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      })
      fs.unlink.mockResolvedValue(undefined)

      await deleteItem(mockRequest, mockResponse)

      expect(fs.unlink).toHaveBeenCalledWith('/safe/file.txt')
      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })

    it('should return 400 if directory is not empty', async () => {
      mockRequest = { body: { path: 'dir' } }
      getSafeUserPath.mockReturnValue('/safe/dir')
      fs.stat.mockResolvedValue({
        isFile: () => false,
        isDirectory: () => true,
      })
      fs.readdir.mockResolvedValue(['not-empty.txt'])

      await deleteItem(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Folder is not empty',
      })
    })

    it('should return 404 if item does not exist', async () => {
      mockRequest = { body: { path: 'ghost.txt' } }
      const error = new Error()
      error.code = 'ENOENT'
      fs.stat.mockRejectedValue(error)

      await deleteItem(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
    })
  })

  describe('renameItem', () => {
    it('should rename item and return 200', async () => {
      mockRequest = { body: { itemPath: 'old.txt', newName: 'new.txt' } }
      getSafeUserPath.mockReturnValue('/safe/old.txt')
      verifyPath.mockReturnValue('/safe/new.txt')
      fs.stat.mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
      })
      fs.access.mockRejectedValue(new Error()) // Destination available
      fs.rename.mockResolvedValue(undefined)

      await renameItem(mockRequest, mockResponse)

      expect(fs.rename).toHaveBeenCalledWith('/safe/old.txt', '/safe/new.txt')
      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })

    it('should return 409 if new name already exists', async () => {
      mockRequest = { body: { itemPath: 'old.txt', newName: 'existing.txt' } }
      getSafeUserPath.mockReturnValue('/safe/old.txt')
      verifyPath.mockReturnValue('/safe/existing.txt')
      fs.stat.mockResolvedValue({ isFile: () => true })
      fs.access.mockResolvedValue(undefined) // Destination taken

      await renameItem(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(409)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'New name already exists',
      })
    })
  })
})
