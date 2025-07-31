// authentication.test.js
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import {
  login,
  TOKEN_COOKIE_NAME,
} from '../../src/controllers/authentication.js'
import User from '../../src/models/user.js'

// Mock dependencies
jest.mock('bcrypt')
jest.mock('jsonwebtoken')
jest.mock('../../src/models/user.js')

// Mock environment variable
process.env.NODE_JS_JWT_SECRET = 'testsecret'

describe('authentication login controller', () => {
  let mockRequest
  let mockResponse

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()

    // Mock request object
    mockRequest = {
      body: {
        username: 'testuser',
        password: 'testpassword',
      },
    }

    // Mock response object with chainable methods
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
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
    bcrypt.compare.mockResolvedValue(true)
    jwt.sign.mockReturnValue('mockedtoken')

    // Act
    await login(mockRequest, mockResponse)

    // Assert
    expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser' })
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'testpassword',
      'hashedpassword'
    )
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: '12345', username: 'testuser' },
      'testsecret',
      { expiresIn: '24h' }
    )
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      TOKEN_COOKIE_NAME,
      'mockedtoken',
      {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: 60 * 60 * 1000,
      }
    )
    expect(mockResponse.status).toHaveBeenCalledWith(200)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Log-in successful',
      username: 'testuser',
    })
  })

  it('shoud return 401 when the user does not exist', async () => {
    User.findOne.mockResolvedValue() // Mock not to find user

    await login(mockRequest, mockResponse)

    expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser' })
    expect(bcrypt.compare).not.toHaveBeenCalled()
    expect(jwt.sign).not.toHaveBeenCalled()

    expect(mockResponse.cookie).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid credentials',
    })
  })

  it('shoud return 401 when the password is incorrect', async () => {
    const mockUser = {
      _id: '56789',
      username: 'testuser',
      password: 'hashedpassword',
    }

    User.findOne.mockResolvedValue(mockUser)
    bcrypt.compare.mockResolvedValue(false) // Mock wrong password

    await login(mockRequest, mockResponse)

    expect(User.findOne).toHaveBeenCalledWith({
      username: mockRequest.body.username,
    })
    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockRequest.body.password,
      mockUser.password
    )
    expect(jwt.sign).not.toHaveBeenCalled()

    expect(mockResponse.cookie).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(401)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Invalid credentials',
    })
  })

  it('shoud retun 500 when data base connextion failed', async () => {
    User.findOne.mockRejectedValue(new Error('Database error'))

    await login(mockRequest, mockResponse)

    expect(User.findOne).toHaveBeenCalledWith({
      username: mockRequest.body.username,
    })

    expect(bcrypt.compare).not.toHaveBeenCalled()
    expect(jwt.sign).not.toHaveBeenCalled()

    expect(mockResponse.cookie).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal server error',
    })
  })

  it('shoud retun 500 when bcrypt failed', async () => {
    const mockUser = {
      _id: '56789',
      username: 'testuser',
      password: 'hashedpassword',
    }
    User.findOne.mockResolvedValue(mockUser)
    bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'))

    await login(mockRequest, mockResponse)

    expect(User.findOne).toHaveBeenCalledWith({
      username: mockRequest.body.username,
    })

    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockRequest.body.password,
      mockUser.password
    )
    expect(jwt.sign).not.toHaveBeenCalled()

    expect(mockResponse.cookie).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal server error',
    })
  })

  it('shoud retun 500 when jwt failed', async () => {
    const mockUser = {
      _id: '56789',
      username: 'testuser',
      password: 'hashedpassword',
    }
    User.findOne.mockResolvedValue(mockUser)
    bcrypt.compare.mockResolvedValue(true)
    jwt.sign.mockImplementation(() => {
      throw new Error('JWT error')
    })

    await login(mockRequest, mockResponse)

    expect(User.findOne).toHaveBeenCalledWith({
      username: mockRequest.body.username,
    })

    expect(bcrypt.compare).toHaveBeenCalledWith(
      mockRequest.body.password,
      mockUser.password
    )

    expect(jwt.sign).toHaveBeenCalledWith(
      { id: mockUser._id, username: mockUser.username },
      process.env.NODE_JS_JWT_SECRET,
      { expiresIn: '24h' }
    )

    expect(mockResponse.cookie).not.toHaveBeenCalled()
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal server error',
    })
  })
})
