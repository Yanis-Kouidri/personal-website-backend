import argon2 from 'argon2'
import { SignJWT } from 'jose'

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
  sign: vi.fn().mockResolvedValue('mockedtoken'),
}

vi.mock('jose', () => ({
  SignJWT: vi.fn().mockImplementation(function () {
    return mockSignJWTInstance
  }),
}))

// --- TESTS ---
describe('Authentication Controller Tests', () => {
  let mockRequest
  let mockResponse

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv(
      'NODE_JS_JWT_SECRET',
      'un_secret_de_test_suffisamment_long_32_chars',
    )
    vi.stubEnv('NODE_JS_SIGN_UP_KEY', 'test_signupkey')

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    }
    mockRequest = { body: {} }
  })

  describe('login()', () => {
    it('should return 200 and set JWT cookie on successful login', async () => {
      mockRequest.body = { username: 'testuser', password: 'testpassword' }
      User.findOne.mockResolvedValue({
        _id: '123',
        username: 'testuser',
        password: 'hash',
      })
      argon2.verify.mockResolvedValue(true)

      await login(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(SignJWT).toHaveBeenCalled()
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        TOKEN_COOKIE_NAME,
        'mockedtoken',
        expect.any(Object),
      )
    })

    it('should return 401 when credentials are invalid', async () => {
      User.findOne.mockResolvedValue(null)
      await login(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })

    it('should return 500 when database fails', async () => {
      User.findOne.mockRejectedValue(new Error('DB Fail'))
      await login(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(500)
    })
  })

  describe('signup()', () => {
    it('should return 201 if signup is successful', async () => {
      mockRequest.body = {
        username: 'new',
        password: 'pwd',
        signupKey: 'test_signupkey',
      }
      User.findOne.mockResolvedValue(null)
      argon2.hash.mockResolvedValue('hashed')
      User.prototype.save = vi.fn().mockResolvedValue()

      await signup(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User successfully created',
      })
    })

    it('should return 401 if signup key is wrong', async () => {
      mockRequest.body.signupKey = 'bad_key'
      await signup(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })
  })

  describe('me()', () => {
    it('should return user data from token', () => {
      mockRequest.tokenData = { username: 'test_user' }
      me(mockRequest, mockResponse)
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({ user: 'test_user' })
    })
  })

  describe('logout()', () => {
    it('should clear cookie and return 200', () => {
      logout(mockRequest, mockResponse)
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        TOKEN_COOKIE_NAME,
        expect.any(Object),
      )
      expect(mockResponse.status).toHaveBeenCalledWith(200)
    })
  })
})
