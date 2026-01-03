import errorHandler from '../../src/middlewares/error-handler.js'

describe('Global Error Handler Middleware', () => {
  let mockRequest
  let mockResponse
  let nextFunction
  let _consoleSpy

  beforeEach(() => {
    // Initialize mocks for each test
    mockRequest = {}
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    nextFunction = vi.fn()

    // Spy on console.error to avoid cluttering test output and verify logging
    _consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // Reset environment variable before each test
    vi.stubEnv('NODE_ENV', 'development')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('should handle SyntaxError (malformed JSON) with 400 status', () => {
    const malformedJsonError = new SyntaxError('Unexpected token')
    malformedJsonError.status = 400
    malformedJsonError.body = '{ invalid }'

    errorHandler(malformedJsonError, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(400)
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: {
        message: 'Invalid JSON payload',
        code: 'BAD_REQUEST',
      },
    })
  })

  it('should return the specific status code and message in development', () => {
    const customError = new Error('Resource not found')
    customError.status = 404
    customError.code = 'NOT_FOUND'

    errorHandler(customError, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(404)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Resource not found',
          code: 'NOT_FOUND',
          stack: expect.any(String), // Stack trace should be present in dev
        }),
      }),
    )
  })

  it('should default to status 500 if no status is provided', () => {
    const genericError = new Error('Unknown crash')

    errorHandler(genericError, mockRequest, mockResponse, nextFunction)

    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
        }),
      }),
    )
  })

  describe('Production Environment Security', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production')
    })

    it('should hide stack trace in production', () => {
      const error = new Error('Sensitive error')

      errorHandler(error, mockRequest, mockResponse, nextFunction)

      const responseBody = mockResponse.json.mock.calls[0][0]
      expect(responseBody.error.stack).toBeUndefined()
    })

    it('should obfuscate 500 error messages in production', () => {
      const sensitiveError = new Error(
        'Database connection string leaked at line 42',
      )

      errorHandler(sensitiveError, mockRequest, mockResponse, nextFunction)

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Internal Server Error', // Generic message
          code: 'INTERNAL_ERROR',
        },
      })
    })

    it('should still allow custom error messages for non-500 errors in production', () => {
      const validationError = new Error('Invalid email format')
      validationError.status = 422

      errorHandler(validationError, mockRequest, mockResponse, nextFunction)

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          message: 'Invalid email format', // Specific message is safe for 4xx errors
          code: 'INTERNAL_ERROR',
        },
      })
    })
  })
})
