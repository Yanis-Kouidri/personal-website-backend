import process from 'node:process'
import { SignJWT } from 'jose'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TOKEN_COOKIE_NAME } from '../../src/controllers/authentication.js'
import authentication from '../../src/middlewares/authentication.js'

// Setup environment variable for tests
process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long'
const encodedSecret = new TextEncoder().encode(process.env.JWT_SECRET)

describe('authentication middleware', () => {
  let request
  let response
  let next

  beforeEach(() => {
    // Reset mocks and objects before each test
    request = {
      cookies: {},
    }

    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    next = vi.fn()

    // Ensure JWT_SECRET is always set unless specifically testing its absence
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long'
  })

  it('should return 401 if token is missing', async () => {
    await authentication(request, response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({
      message: 'Authentication required. Please log in.',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 500 if JWT_SECRET is missing from environment', async () => {
    // We provide a dummy token to bypass the first "if (!token)" check
    request.cookies[TOKEN_COOKIE_NAME] = 'any-token-string'

    // Now we remove the secret
    delete process.env.JWT_SECRET

    await authentication(request, response, next)

    expect(response.status).toHaveBeenCalledWith(500)
    expect(response.json).toHaveBeenCalledWith({
      message: 'Internal server error configuration.',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 if token is invalid or malformed', async () => {
    request.cookies[TOKEN_COOKIE_NAME] = 'this.is.not.a.valid.jwt'

    await authentication(request, response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Invalid or expired session. Please log in again.',
      }),
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next and attach data to request.user if token is valid', async () => {
    const payload = { id: 'user_123', username: 'tester' }

    // Create a valid signed token
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(encodedSecret)

    request.cookies[TOKEN_COOKIE_NAME] = token

    await authentication(request, response, next)

    // Verify property name changed from tokenData to user
    expect(request.user).toEqual(expect.objectContaining(payload))
    expect(next).toHaveBeenCalled()
    expect(response.status).not.toHaveBeenCalled()
  })
})
