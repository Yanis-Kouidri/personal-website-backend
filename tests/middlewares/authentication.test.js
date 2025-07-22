import jwt from 'jsonwebtoken'
import authentication from '../../src/middlewares/authentication.js'
import { TOKEN_COOKIE_NAME } from '../../src/controllers/auth.js'

// mock env variable inside the test (will no use .env file value because it's override here)
process.env.NODE_JS_JWT_SECRET = 'testsecret'

describe('authentication middleware', () => {
  let request, response, next

  beforeEach(() => {
    request = {
      cookies: {},
    }

    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    }

    next = jest.fn()
  })

  it('should return 401 if token is missing', () => {
    authentication(request, response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalledWith({
      message: 'You must be log-in to access this page',
    })
    expect(next).not.toHaveBeenCalled()
  })

  it('should return 401 if token is invalid', () => {
    request.cookies[TOKEN_COOKIE_NAME] = 'invalid.token'

    authentication(request, response, next)

    expect(response.status).toHaveBeenCalledWith(401)
    expect(response.json).toHaveBeenCalled()
    expect(next).not.toHaveBeenCalled()
  })

  it('should call next and attach tokenData if token is valid', () => {
    const payload = { userId: 'abc123' }
    const token = jwt.sign(payload, process.env.NODE_JS_JWT_SECRET)

    request.cookies[TOKEN_COOKIE_NAME] = token

    authentication(request, response, next)

    expect(request.tokenData).toEqual(expect.objectContaining(payload))
    expect(next).toHaveBeenCalled()
    expect(response.status).not.toHaveBeenCalled()
  })
})
