import jws from 'jsonwebtoken'
import { TOKEN_COOKIE_NAME } from '../controllers/auth.js'

const JWT_SECRET = process.env.JWT_SECRET

function authentication(req, res, next) {
  const token = req.cookies[TOKEN_COOKIE_NAME]
  if (!token) {
    return res
      .status(401)
      .json({ message: 'You must be log-in to access this page' })
  }

  try {
    const tokenData = jws.verify(token, JWT_SECRET)
    req.tokenData = tokenData
    next()
  } catch (error) {
    return res.status(401).json({ message: error })
  }
}

export default authentication
