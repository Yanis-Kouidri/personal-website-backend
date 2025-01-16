import jws from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

function authentication(req, res, next) {
  const token = req.cookies.token
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
