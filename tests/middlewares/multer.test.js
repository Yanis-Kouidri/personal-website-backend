import fs from 'node:fs'
import express from 'express'
import request from 'supertest'

import { documentUpload, errorHandler } from '../../src/middlewares/multer'

vi.mock('node:fs', async (importOriginal) => {
  const actualFs = await importOriginal()

  // On crée nos mocks
  const existsSync = vi.fn()
  const statSync = vi.fn()

  // On prépare l'objet qui contient tout (original + nos mocks)
  const mockedModule = {
    ...actualFs,
    existsSync,
    statSync,
  }

  return {
    ...mockedModule,
    // CRUCIAL : on définit l'export par défaut pour 'import fs from "node:fs"'
    default: mockedModule,
  }
})

const app = express()
app.post(
  '/upload',
  (request_, _response, next) => {
    // mock req.query.path for testing
    request_.query.path = request_.headers['x-path'] || ''
    next()
  },
  documentUpload.single('file'),
  (request_, response) => response.status(200).json({ file: request_.file }),
  errorHandler,
)

describe('multer middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('storage.destination', () => {
    it('should store file in valid subfolder', async () => {
      fs.existsSync.mockReturnValue(true)
      fs.statSync.mockReturnValue({ isDirectory: () => true })

      const response = await request(app)
        .post('/upload')
        .set('x-path', 'subfolder')
        .attach('file', Buffer.from('dummy'), 'test.pdf')

      expect(response.status).toBe(200)
      expect(response.body.file).toBeDefined()
    })

    it('should reject if folder does not exist', async () => {
      fs.existsSync.mockReturnValue(false)

      const response = await request(app)
        .post('/upload')
        .set('x-path', 'notfound')
        .attach('file', Buffer.from('dummy'), 'test.pdf')

      expect(response.status).toBe(400)
      expect(response.body.message).toMatch(/Specified folder does not exist/)
    })
  })

  describe('storage.filename', () => {
    it('should decode URI components in filename', async () => {
      fs.existsSync.mockReturnValue(true)
      fs.statSync.mockReturnValue({ isDirectory: () => true })

      const response = await request(app)
        .post('/upload')
        .set('x-path', '')
        .attach(
          'file',
          Buffer.from('dummy'),
          encodeURIComponent('file name.pdf'),
        )

      expect(response.status).toBe(200)
      expect(response.body.file.originalname).toBe('file%20name.pdf')
    })
  })

  describe('documentationFileFilter', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true)
      fs.statSync.mockReturnValue({ isDirectory: () => true })
    })

    it('should accept supported file types', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('file', Buffer.from('dummy'), 'test.docx')

      expect(response.status).toBe(200)
      expect(response.body.file).toBeDefined()
    })

    it('should reject unsupported file types', async () => {
      const response = await request(app)
        .post('/upload')
        .attach('file', Buffer.from('dummy'), 'test.exe')

      expect(response.status).toBe(400)
      expect(response.body.message).toMatch(/File type not supported/)
    })
  })

  describe('limits', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true)
      fs.statSync.mockReturnValue({ isDirectory: () => true })
    })

    it('should reject files over 8MB', async () => {
      const bigBuffer = Buffer.alloc(8_000_001)
      const response = await request(app)
        .post('/upload')
        .attach('file', bigBuffer, 'bigfile.pdf')

      expect(response.status).toBe(400)
      expect(response.body.message).toMatch(/File too large/)
    })
  })
})

// We recommend installing an extension to run vi tests.
