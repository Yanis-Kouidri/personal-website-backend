import argon2 from 'argon2'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  login,
  logout,
  me,
  signup,
  TOKEN_COOKIE_NAME,
} from '../../src/controllers/authentication.js'
import User from '../../src/models/user.js'

// --- MOCKS ---
vi.mock('argon2')
vi.mock('../../src/models/user.js')

const mockSignJWTInstance = {
  setProtectedHeader: vi.fn().mockReturnThis(),
  setIssuedAt: vi.fn().mockReturnThis(),
  setExpirationTime: vi.fn().mockReturnThis(),
  sign: vi.fn().mockResolvedValue('mocked-jwt-token'),
}

vi.mock('jose', () => ({
  // biome-ignore lint/complexity/useArrowFunction: <Need classif function to support key word new>
  SignJWT: vi.fn().mockImplementation(function () {
    return mockSignJWTInstance
  }),
}))

describe('Authentication Controller', () => {
  let mockRequest
  let mockResponse

  beforeEach(() => {
    vi.clearAllMocks()

    // Update to new environment variable names
    vi.stubEnv('JWT_SECRET', 'test-secret-at-least-32-characters-long')
    vi.stubEnv('SIGNUP_KEY', 'valid-signup-key')
    vi.stubEnv('NODE_ENV', 'test')

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    }
    mockRequest = { body: {} }
  })

  describe('login()', () => {
    it('should return 200 and set secure cookie on successful login', async () => {
      mockRequest.body = { username: 'testuser', password: 'password123' }

      User.findOne.mockResolvedValue({
        _id: 'user_id_123',
        username: 'testuser',
        password: 'hashed_password',
      })
      argon2.verify.mockResolvedValue(true)

      await login(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        TOKEN_COOKIE_NAME,
        'mocked-jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'Lax',
        }),
      )
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          user: { username: 'testuser' },
        }),
      )
    })

    it('should return 401 for invalid credentials (security: generic message)', async () => {
      mockRequest.body = { username: 'wrong', password: 'wrong' }
      User.findOne.mockResolvedValue(null)

      await login(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid username or password',
      })
    })
  })

  describe('signup()', () => {
    it('should return 201 if signup is successful with valid key', async () => {
      mockRequest.body = {
        username: 'newuser',
        password: 'ComplexPassword123!',
        signupKey: 'valid-signup-key',
      }

      User.findOne.mockResolvedValue(null)
      argon2.hash.mockResolvedValue('hashed_pwd')
      // Mock the save method on the prototype for Mongoose
      User.prototype.save = vi.fn().mockResolvedValue()

      await signup(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User successfully created',
      })
    })

    it('should return 403 if signup key is invalid (new security rule)', async () => {
      mockRequest.body = {
        username: 'attacker',
        password: 'password',
        signupKey: 'wrong-key',
      }

      await signup(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid or missing signup key',
      })
    })

    it('should return 409 if user already exists', async () => {
      mockRequest.body = {
        username: 'existinguser',
        password: 'password',
        signupKey: 'valid-signup-key',
      }
      User.findOne.mockResolvedValue({ username: 'existinguser' })

      await signup(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(409)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Username already taken',
      })
    })
  })

  describe('me()', () => {
    it('should return user data using request.user (standardized)', () => {
      // Setup the request object as if the middleware has run
      mockRequest.user = { id: '123', username: 'john_doe' }

      me(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: { id: '123', username: 'john_doe' },
      })
    })

    it('should return 401 if user data is missing from request', () => {
      mockRequest.user = undefined

      me(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })
  })

  describe('logout()', () => {
    it('should clear the cookie and return 200', () => {
      logout(mockRequest, mockResponse)

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        TOKEN_COOKIE_NAME,
        expect.any(Object),
      )
      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })
  })
})
