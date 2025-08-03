import fs from 'node:fs'
import path from 'node:path'

import {
  addOneDocument,
  deleteItem,
  getAllDocumentation,
  newFolder,
  renameItem,
} from '../../src/controllers/documentation'
import {
  getSafeUserPath,
  listFilesAndDirectories,
  DOCUMENTATION_DIRECTORY,
} from '../../src/utils/file-system-interaction'

jest.mock('node:fs')
jest.mock('node:path')
jest.mock('../../src/utils/file-system-interaction')

describe('test getAllDocumentation controller', () => {
  let mockRequest, mockResponse

  beforeEach(() => {
    // jest.spyOn(console, 'log').mockRestore()
    // jest.spyOn(console, 'error').mockRestore()
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  it('should return a json file', () => {
    fs.existsSync.mockReturnValue(true)
    const mockFilesAndDirectories = [
      {
        type: 'file',
        name: 'file1.txt',
        path: 'path/to/file1.txt',
      },
    ]

    const mockResult = [
      {
        type: 'directory',
        name: '/',
        path: '',
        contents: mockFilesAndDirectories,
      },
    ]

    listFilesAndDirectories.mockReturnValue(mockFilesAndDirectories)

    getAllDocumentation(mockRequest, mockResponse)

    expect(mockResponse.status).not.toHaveBeenCalled() // Because express automaticly set 200 by default so it can't be test here because it mocked
    expect(mockResponse.json).toHaveBeenCalledWith(mockResult)
  })

  it('should create documentation directory if it does not exist', () => {
    fs.existsSync.mockReturnValue(false)
    fs.mkdirSync.mockReturnValue()

    listFilesAndDirectories.mockReturnValue()

    getAllDocumentation(mockRequest, mockResponse)

    expect(fs.existsSync).toHaveBeenCalledWith(DOCUMENTATION_DIRECTORY)
    expect(fs.mkdirSync).toHaveBeenCalledWith(DOCUMENTATION_DIRECTORY, {
      recursive: true,
    })
  })

  it('should return 500 in case of error', () => {
    fs.existsSync.mockReturnValue(true)

    listFilesAndDirectories.mockImplementation(() => {
      throw new Error('Error listing files and directories')
    })

    getAllDocumentation(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Erreur lors de la lecture des documents.',
    })

    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
  })
})

describe('test addOneDocument controller', () => {
  let mockRequest, mockResponse

  beforeEach(() => {
    // jest.spyOn(console, 'log').mockRestore()
    // jest.spyOn(console, 'error').mockRestore()

    mockRequest = {
      file: 'something',
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  it('should return 200 in case of sucess', () => {
    addOneDocument(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'File uploaded !',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
  })
})

describe('test newFolder controller', () => {
  let mockRequest, mockResponse

  beforeEach(() => {
    // jest.spyOn(console, 'log').mockRestore()
    // jest.spyOn(console, 'error').mockRestore()

    mockRequest = {
      body: {
        folderName: 'mockName',
        folderPath: 'mockPath',
      },
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  it('should return 200 in case of sucess', () => {
    path.join.mockReturnValue('mockPath/mockName')
    getSafeUserPath.mockReturnValue('mockPath/mockName')
    fs.existsSync.mockReturnValue(false)
    fs.mkdirSync.mockReturnValue()

    newFolder(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Folder created successfully',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
  })

  it('should return 401 if folder already exist', () => {
    path.join.mockReturnValue('mockPath/mockName')
    getSafeUserPath.mockReturnValue('mockPath/mockName')
    fs.existsSync.mockReturnValue(true)
    fs.mkdirSync.mockReturnValue()

    newFolder(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Folder already exists',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
  })

  it('should return 500 if error raised during folder creation', () => {
    path.join.mockReturnValue('mockPath/mockName')
    getSafeUserPath.mockReturnValue('mockPath/mockName')
    fs.existsSync.mockReturnValue(false)
    fs.mkdirSync.mockImplementation(() => {
      throw new Error('Error during directory creation')
    })

    newFolder(mockRequest, mockResponse)

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal server error',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
  })
})

describe('test deleteItem controller', () => {
  let mockRequest, mockResponse

  beforeEach(() => {
    // jest.spyOn(console, 'log').mockRestore()
    // jest.spyOn(console, 'error').mockRestore()

    mockRequest = {
      body: {
        path: 'mockPath',
      },
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  it('should return 200 when file is successfully deleted', () => {
    const mockPath = 'mockPath'
    const safeUserPath = 'safeUserPath'

    path.join.mockReturnValue(mockPath)
    getSafeUserPath.mockReturnValue(safeUserPath)
    fs.existsSync.mockReturnValue(true)
    fs.statSync.mockReturnValue({
      isFile: () => true,
      isDirectory: () => false,
    })
    fs.unlinkSync.mockReturnValue()

    deleteItem(mockRequest, mockResponse)

    expect(getSafeUserPath).toHaveBeenCalledWith(mockPath)
    expect(fs.statSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.unlinkSync).toHaveBeenCalledWith(safeUserPath)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'File successfully deleted',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.unlinkSync).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.statSync).toHaveBeenCalledBefore(fs.unlinkSync)
    expect(getSafeUserPath).toHaveBeenCalledBefore(fs.unlinkSync)
  })

  it('should return 404 if item not found', () => {
    const mockPath = 'mockPath'
    const safeUserPath = 'safeUserPath'

    path.join.mockReturnValue(mockPath)
    getSafeUserPath.mockReturnValue(safeUserPath)
    fs.existsSync.mockReturnValue(false) // No item found
    fs.statSync.mockReturnValue()
    fs.unlinkSync.mockReturnValue()

    deleteItem(mockRequest, mockResponse)

    expect(getSafeUserPath).toHaveBeenCalledWith(mockPath)
    expect(fs.statSync).not.toHaveBeenCalled()
    expect(fs.unlinkSync).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(404)

    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Item does not exist',
    })

    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
    expect(getSafeUserPath).toHaveBeenCalledBefore(fs.existsSync)
  })

  it('should return 200 when empty directory is successfully deleted', () => {
    const mockPath = 'mockPath'
    const safeUserPath = 'safeUserPath'

    path.join.mockReturnValue(mockPath)
    getSafeUserPath.mockReturnValue(safeUserPath)
    fs.existsSync.mockReturnValue(true)
    fs.statSync.mockReturnValue({
      isFile: () => false,
      isDirectory: () => true,
    })
    fs.readdirSync.mockReturnValue([])
    fs.rmdirSync.mockReturnValue()

    deleteItem(mockRequest, mockResponse)

    expect(getSafeUserPath).toHaveBeenCalledWith(mockPath)
    expect(fs.existsSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.statSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.readdirSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.rmdirSync).toHaveBeenCalledWith(safeUserPath)
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Folder successfully deleted',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.rmdirSync).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.readdirSync).toHaveBeenCalledBefore(fs.rmdirSync)
    expect(fs.statSync).toHaveBeenCalledBefore(fs.readdirSync)
    expect(getSafeUserPath).toHaveBeenCalledBefore(fs.statSync)
  })

  it('should return 401 if directory is not empty', () => {
    const mockPath = 'mockPath'
    const safeUserPath = 'safeUserPath'

    path.join.mockReturnValue(mockPath)
    getSafeUserPath.mockReturnValue(safeUserPath)
    fs.existsSync.mockReturnValue(true)
    fs.statSync.mockReturnValue({
      isFile: () => false,
      isDirectory: () => true,
    })
    fs.readdirSync.mockReturnValue(['file1.txt', 'file2.txt'])

    deleteItem(mockRequest, mockResponse)

    expect(getSafeUserPath).toHaveBeenCalledWith(mockPath)
    expect(fs.existsSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.statSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.readdirSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.rmdirSync).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Folder is not empty',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.readdirSync).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.statSync).toHaveBeenCalledBefore(fs.readdirSync)
    expect(getSafeUserPath).toHaveBeenCalledBefore(fs.statSync)
  })

  it('should return 400 for invalid item type', () => {
    const mockPath = 'mockPath'
    const safeUserPath = 'safeUserPath'

    path.join.mockReturnValue(mockPath)
    getSafeUserPath.mockReturnValue(safeUserPath)
    fs.existsSync.mockReturnValue(true)
    fs.statSync.mockReturnValue({
      isFile: () => false,
      isDirectory: () => false,
    })

    deleteItem(mockRequest, mockResponse)

    expect(getSafeUserPath).toHaveBeenCalledWith(mockPath)
    expect(fs.existsSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.statSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.unlinkSync).not.toHaveBeenCalled()
    expect(fs.readdirSync).not.toHaveBeenCalled()
    expect(fs.rmdirSync).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid item type',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.statSync).toHaveBeenCalledBefore(mockResponse.json)
    expect(getSafeUserPath).toHaveBeenCalledBefore(fs.statSync)
  })

  it('should return 500 if file deletion fails', () => {
    const mockJoinPath = 'mockPath'
    const safeUserPath = 'safeUserPath'
    const error = new Error('File deletion error')

    path.join.mockReturnValue(mockJoinPath)
    getSafeUserPath.mockReturnValue(safeUserPath)
    fs.existsSync.mockReturnValue(true)
    fs.statSync.mockReturnValue({
      isFile: () => true,
      isDirectory: () => false,
    })
    fs.unlinkSync.mockImplementation(() => {
      throw error
    })

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    deleteItem(mockRequest, mockResponse)

    expect(getSafeUserPath).toHaveBeenCalledWith(mockJoinPath)
    expect(fs.existsSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.statSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.unlinkSync).toHaveBeenCalledWith(safeUserPath)
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error deleting file:', error)
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal server error',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.unlinkSync).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.statSync).toHaveBeenCalledBefore(fs.unlinkSync)
    expect(getSafeUserPath).toHaveBeenCalledBefore(fs.statSync)

    consoleErrorSpy.mockRestore()
  })

  it('should return 500 if directory deletion fails', () => {
    const mockPath = 'mockPath'
    const safeUserPath = 'safeUserPath'
    const error = new Error('Directory deletion error')

    path.join.mockReturnValue(mockPath)
    getSafeUserPath.mockReturnValue(safeUserPath)
    fs.existsSync.mockReturnValue(true)
    fs.statSync.mockReturnValue({
      isFile: () => false,
      isDirectory: () => true,
    })
    fs.readdirSync.mockReturnValue([])
    fs.rmdirSync.mockImplementation(() => {
      throw error
    })

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    deleteItem(mockRequest, mockResponse)

    expect(getSafeUserPath).toHaveBeenCalledWith(mockPath)
    expect(fs.existsSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.statSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.readdirSync).toHaveBeenCalledWith(safeUserPath)
    expect(fs.rmdirSync).toHaveBeenCalledWith(safeUserPath)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error deleting folder:',
      error
    )
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal server error',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.rmdirSync).toHaveBeenCalledBefore(mockResponse.json)
    expect(fs.readdirSync).toHaveBeenCalledBefore(fs.rmdirSync)
    expect(fs.statSync).toHaveBeenCalledBefore(fs.readdirSync)
    expect(getSafeUserPath).toHaveBeenCalledBefore(fs.statSync)

    consoleErrorSpy.mockRestore()
  })
})

describe('test renameItem controller', () => {
  let mockRequest, mockResponse

  beforeEach(() => {
    mockRequest = {
      body: {
        itemPath: 'mockPath',
        newName: 'newName',
      },
    }

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if newName contains invalid characters', () => {
    mockRequest.body.newName = 'invalid/name'

    renameItem(mockRequest, mockResponse)

    expect(path.join).not.toHaveBeenCalled()
    expect(getSafeUserPath).not.toHaveBeenCalled()
    expect(fs.existsSync).not.toHaveBeenCalled()
    expect(fs.statSync).not.toHaveBeenCalled()
    expect(fs.renameSync).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'New name contains invalid characters',
    })
    expect(mockResponse.status).toHaveBeenCalledBefore(mockResponse.json)
  })
})
