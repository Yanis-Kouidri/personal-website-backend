import fs from 'node:fs'
import path from 'node:path'

import {
  getSafeUserPath,
  DOCUMENTATION_DIRECTORY,
  listFilesAndDirectories,
} from '../../src/utils/file-system-interaction'

describe('getSafeUserPath', () => {
  it('should return the correct resolved path for a valid user path', () => {
    const userPath = 'some/valid/path'
    const expectedPath = path.resolve(
      path.join(DOCUMENTATION_DIRECTORY, userPath)
    )
    expect(getSafeUserPath(userPath)).toBe(expectedPath)
  })

  it('should throw an error for a path that tries to access outside the documentation directory', () => {
    const userPath = '../../outside/path'
    expect(() => getSafeUserPath(userPath)).toThrow('Invalid path')
  })

  it('should throw an error for a path that tries to access a hidden file', () => {
    const userPath = 'some/.hiddenfile'
    expect(() => getSafeUserPath(userPath)).toThrow(
      'Access to hidden files is forbidden'
    )
  })
})

jest.mock('node:fs')

describe('listFilesAndDirectories', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should list a single file in the directory', () => {
    fs.readdirSync.mockReturnValue(['file1.txt'])
    fs.statSync.mockReturnValue({ isDirectory: () => false })

    const result = listFilesAndDirectories(DOCUMENTATION_DIRECTORY)

    expect(result).toEqual([
      {
        type: 'file',
        name: 'file1.txt',
        path: 'file1.txt',
      },
    ])
  })

  it('should list a single directory with no contents', () => {
    fs.readdirSync.mockReturnValue(['folder'])
    fs.statSync.mockReturnValueOnce({ isDirectory: () => true })
    fs.readdirSync.mockReturnValueOnce([])

    const result = listFilesAndDirectories(DOCUMENTATION_DIRECTORY)

    expect(result).toEqual([])
  })

  it('should list nested files and directories recursively', () => {
    fs.readdirSync
      .mockReturnValueOnce(['folder']) // root level
      .mockReturnValueOnce(['nested.txt']) // inside folder

    fs.statSync
      .mockReturnValueOnce({ isDirectory: () => true }) // folder
      .mockReturnValueOnce({ isDirectory: () => false }) // nested.txt

    const result = listFilesAndDirectories(DOCUMENTATION_DIRECTORY)

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

  it('should handle mixed files and directories', () => {
    fs.readdirSync
      .mockReturnValueOnce(['file1.txt', 'dir1']) // root
      .mockReturnValueOnce(['subfile.txt']) // inside dir1

    fs.statSync
      .mockReturnValueOnce({ isDirectory: () => false }) // file1.txt
      .mockReturnValueOnce({ isDirectory: () => true }) // dir1
      .mockReturnValueOnce({ isDirectory: () => false }) // subfile.txt

    const result = listFilesAndDirectories(DOCUMENTATION_DIRECTORY)

    expect(result).toEqual([
      {
        type: 'file',
        name: 'file1.txt',
        path: 'file1.txt',
      },
      {
        type: 'directory',
        name: 'dir1',
        path: 'dir1',
        contents: [
          {
            type: 'file',
            name: 'subfile.txt',
            path: path.join('dir1', 'subfile.txt'),
          },
        ],
      },
    ])
  })
})
