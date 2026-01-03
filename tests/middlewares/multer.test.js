import { Stream } from 'node:stream'
import express from 'express'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/utils/file-system-interaction', () => ({
  getSafeUserPath: vi.fn(),
  verifyPath: vi.fn(),
}))

vi.mock('node:fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    statSync: vi.fn(() => ({ isDirectory: () => true })),
    createWriteStream: vi.fn(() => {
      const mockStream = new Stream.Writable()
      mockStream._write = (_chunk, _encoding, next) => next()
      setTimeout(() => mockStream.emit('finish'), 5)
      return mockStream
    }),
  },
}))

vi.mock('node:fs/promises', () => ({
  default: {
    stat: vi.fn().mockResolvedValue({ isDirectory: () => true }),
    access: vi.fn().mockResolvedValue(undefined),
  },
}))

import { documentUpload, errorHandler } from '../../src/middlewares/multer'
import { getSafeUserPath } from '../../src/utils/file-system-interaction'

const app = express()
app.post(
  '/upload',
  (req, _res, next) => {
    req.query.path = req.headers['x-path'] || ''
    next()
  },
  documentUpload.single('file'),
  (req, res) => res.status(201).json({ file: req.file }),
  errorHandler,
)

describe('multer middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getSafeUserPath).mockReturnValue('/tmp')
  })

  describe('storage.destination', () => {
    it('should allow upload in a valid subfolder', async () => {
      const response = await request(app)
        .post('/upload')
        .set('x-path', 'docs')
        .attach('file', Buffer.from('test content'), 'test.pdf')

      expect(response.status).toBe(201)
    })

    it('should reject if getSafeUserPath throws an error', async () => {
      vi.mocked(getSafeUserPath).mockImplementation(() => {
        throw new Error('Invalid path: Access denied')
      })

      const response = await request(app)
        .post('/upload')
        .set('x-path', 'notfound')
        .attach('file', Buffer.from('dummy'), 'test.pdf')

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Invalid path: Access denied')
    })
  })

  describe('storage.filename', () => {
    it('should sanitize', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('file', Buffer.from('dummy'), 'my report.pdf')

      expect(response.status).toBe(201)
      expect(response.body.file.filename).toMatch(/^my_report.pdf$/)
    })
  })

  describe('documentationFileFilter', () => {
    it('should reject unsupported file types', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('file', Buffer.from('dummy'), 'script.sh')

      expect(response.status).toBe(400)
      expect(response.body.message).toMatch(/File type not supported/)
    })
  })

  describe('limits', () => {
    it('should return 413 if file exceeds 8MB', async () => {
      const bigBuffer = Buffer.alloc(8 * 1024 * 1024 + 1024)

      const response = await request(app)
        .post('/upload')
        .attach('file', bigBuffer, 'huge.pdf')

      expect(response.status).toBe(413)
      expect(response.body.message).toMatch(/File is too large/)
    })
  })
})
