import jwt from 'jsonwebtoken'
import { TOKEN_COOKIE_NAME } from '../controllers/auth.js'

const NODE_JS_JWT_SECRET = process.env.NODE_JS_JWT_SECRET

function authentication(request, response, next) {
  const token = request.cookies[TOKEN_COOKIE_NAME]
  if (!token) {
    return response
      .status(401)
      .json({ message: 'You must be log-in to access this page' })
  }

  try {
    const tokenData = jwt.verify(token, NODE_JS_JWT_SECRET)
    request.tokenData = tokenData
    next()
  } catch (error) {
    return response.status(401).json({ message: error })
  }
}

export default authentication
