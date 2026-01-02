import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SignJWT } from 'jose'

import { TOKEN_COOKIE_NAME } from '../../src/controllers/authentication.js'
import authentication from '../../src/middlewares/authentication.js'

process.env.NODE_JS_JWT_SECRET = 'testsecret'
const secret = new TextEncoder().encode(process.env.NODE_JS_JWT_SECRET) //

describe('authentication middleware', () => {
  let request, response, next

  beforeEach(() => {
    request = {
      cookies: {},
    }

    response = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    next = vi.fn()
  })

  it('should return 401 if token is missing', async () => {
    await authentication(request, response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({
      message: 'You must be log-in to access this page',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 if token is invalid', async () => {
    request.cookies[TOKEN_COOKIE_NAME] = 'invalid.token'

    await authentication(request, response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next and attach tokenData if token is valid', async () => {
    const payload = { userId: 'abc123' }

    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret)

    request.cookies[TOKEN_COOKIE_NAME] = token

    await authentication(request, response, next)

    expect(request.tokenData).toEqual(expect.objectContaining(payload))
    expect(next).toHaveBeenCalled()
    expect(response.status).not.toHaveBeenCalled()
  })
})
