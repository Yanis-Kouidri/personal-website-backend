import { beforeEach, describe, expect, it, vi } from 'vitest'
import { validateBody } from '../../src/middlewares/validate-body'

describe('validateBody middleware', () => {
  let request
  let response
  let next

  // Mock for the Zod-like schema
  const mockSafeParse = vi.fn()
  const mockSchema = {
    safeParse: mockSafeParse,
  }

  beforeEach(() => {
    vi.clearAllMocks()

    request = {
      body: {},
    }

    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    next = vi.fn()
  })

  it('should call next() and sanitize request.body if validation succeeds', () => {
    const rawData = { email: ' test@example.com ', extra: 'hidden' }
    const validatedData = { email: 'test@example.com' } // Zod would trim and strip 'extra'

    request.body = rawData
    mockSafeParse.mockReturnValue({ success: true, data: validatedData })

    const middleware = validateBody(mockSchema)
    middleware(request, response, next)

    // Ensure the body is replaced by the cleaned data (sanitization)
    expect(request.body).toEqual(validatedData)
    expect(request.body.extra).toBeUndefined()
    expect(next).toHaveBeenCalled()
  })

  it('should return 400 with structured errors if validation fails', () => {
    const mockErrors = { username: ['Required'] }
    mockSafeParse.mockReturnValue({
      success: false,
      error: {
        format: vi.fn(),
        flatten: vi.fn().mockReturnValue({ fieldErrors: mockErrors }),
      },
    })

    const middleware = validateBody(mockSchema)
    middleware(request, response, next)

    expect(response.status).toHaveBeenCalledWith(400)
    expect(response.json).toHaveBeenCalledWith({
      status: 'error',
      message: 'Validation failed',
      errors: mockErrors,
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should log detailed error in development environment', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const formattedError = { _errors: [], username: { _errors: ['Too short'] } }

    mockSafeParse.mockReturnValue({
      success: false,
      error: {
        format: vi.fn().mockReturnValue(formattedError),
        flatten: vi.fn().mockReturnValue({ fieldErrors: {} }),
      },
    })

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const middleware = validateBody(mockSchema)
    middleware(request, response, next)

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[Validation Error]:',
      JSON.stringify(formattedError, null, 2),
    )
  })

  it('should not log detailed error in production environment', () => {
    vi.stubEnv('NODE_ENV', 'production')

    mockSafeParse.mockReturnValue({
      success: false,
      error: {
        format: vi.fn(),
        flatten: vi.fn().mockReturnValue({ fieldErrors: {} }),
      },
    })

    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    const middleware = validateBody(mockSchema)
    middleware(request, response, next)

    expect(consoleWarnSpy).not.toHaveBeenCalled()
  })
})
