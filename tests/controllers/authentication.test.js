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
})
