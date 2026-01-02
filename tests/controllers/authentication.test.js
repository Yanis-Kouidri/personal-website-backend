import argon2 from 'argon2'
import jwt from 'jsonwebtoken'

import {
  login,
  logout,
  me,
  signup,
  TOKEN_COOKIE_NAME,
} from '../../src/controllers/authentication.js'
import User from '../../src/models/user.js'

vi.mock('argon2')
vi.mock('jsonwebtoken')
vi.mock('../../src/models/user.js')

describe('Authentication Controller Tests', () => {
  let mockRequest
  let mockResponse

  beforeAll(() => {
    process.env.NODE_JS_JWT_SECRET = 'test_secret'
    process.env.NODE_JS_SIGN_UP_KEY = 'test_signupkey'
  })

  beforeEach(() => {
    vi.clearAllMocks()

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
    }
  })

  describe('login controller', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          username: 'testuser',
          password: 'testpassword',
        },
      }
    })

    it('should return 200 and set JWT cookie on successful login', async () => {
      // Arrange
      const mockUser = {
        _id: '12345',
        username: 'testuser',
        password: 'hashedpassword',
      }

      User.findOne.mockResolvedValue(mockUser)
      argon2.verify.mockResolvedValue(true)
      jwt.sign.mockReturnValue('mockedtoken')

      // Act
      await login(mockRequest, mockResponse)

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ username: mockUser.username })
      expect(argon2.verify).toHaveBeenCalledWith(
        mockUser.password,
        mockRequest.body.password,
      )
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: mockUser._id, username: mockUser.username },
        process.env.NODE_JS_JWT_SECRET,
        { expiresIn: '24h' },
      )
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        TOKEN_COOKIE_NAME,
        'mockedtoken',
        {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          maxAge: 60 * 60 * 1000,
        },
      )
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Log-in successful',
        username: mockRequest.body.username,
      })
    })

    it('should return 401 when the user does not exist', async () => {
      User.findOne.mockResolvedValue()

      await login(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid credentials',
      })
      expect(argon2.verify).not.toHaveBeenCalled()
    })

    it('should return 401 when the password is incorrect', async () => {
      const mockUser = { password: 'hashedpassword' }
      User.findOne.mockResolvedValue(mockUser)
      argon2.verify.mockResolvedValue(false)

      await login(mockRequest, mockResponse)

      expect(argon2.verify).toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })

    it('should return 500 when database connection fails', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'))

      await login(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal server error',
      })
    })

    it('should return 500 when argon2 fails', async () => {
      User.findOne.mockResolvedValue({ password: 'hash' })
      argon2.verify.mockRejectedValue(new Error('Argon2 error'))

      await login(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
    })
  })

  describe('signup controller', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          username: 'test_user',
          password: 'test_password',
          signupKey: 'test_signupkey',
        },
      }
    })

    it('should return 201 if signup is successful', async () => {
      User.findOne.mockResolvedValue()
      argon2.hash.mockResolvedValue('hashed_password')
      User.prototype.save = vi.fn().mockResolvedValue()

      await signup(mockRequest, mockResponse)

      expect(argon2.hash).toHaveBeenCalledWith(
        mockRequest.body.password,
        expect.any(Object),
      )

      expect(User.prototype.save).toHaveBeenCalledOnce()
      expect(mockResponse.status).toHaveBeenCalledWith(201)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User successfully created',
      })
    })

    it('should return 401 if signup key is invalid', async () => {
      mockRequest.body.signupKey = 'wrong_key'

      await signup(mockRequest, mockResponse)

      expect(User.findOne).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })

    it('should return 401 if user already exists', async () => {
      User.findOne.mockResolvedValue({ username: 'existing' })

      await signup(mockRequest, mockResponse)

      expect(argon2.hash).not.toHaveBeenCalled()
      expect(mockResponse.status).toHaveBeenCalledWith(401)
    })
  })

  describe('me controller', () => {
    it('should return 200 and user data from token', () => {
      mockRequest = { tokenData: { username: 'test_user' } }

      me(mockRequest, mockResponse)

      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: 'test_user',
      })
    })
  })

  describe('logout controller', () => {
    it('should clear cookie and return 200', () => {
      logout(mockRequest, mockResponse)

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        TOKEN_COOKIE_NAME,
        expect.any(Object),
      )
      expect(mockResponse.status).toHaveBeenCalledWith(200)
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Log-out successful',
      })
    })
  })
})
