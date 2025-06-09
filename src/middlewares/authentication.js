import jws from 'jsonwebtoken'
import { TOKEN_COOKIE_NAME } from '../controllers/auth.js'

const NODE_JS_JWT_SECRET = process.env.NODE_JS_JWT_SECRET

function authentication(req, res, next) {
  const token = req.cookies[TOKEN_COOKIE_NAME]
  if (!token) {
    return res
      .status(401)
      .json({ message: 'You must be log-in to access this page' })
  }

  try {
    const tokenData = jws.verify(token, NODE_JS_JWT_SECRET)
    req.tokenData = tokenData
    next()
  } catch (error) {
    return res.status(401).json({ message: error })
  }
}

export default authentication
