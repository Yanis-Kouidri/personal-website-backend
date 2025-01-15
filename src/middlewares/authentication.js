import jws from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

function authentication(req, res, next) {
  console.log(req.cookies.token)
  const token = req.cookies.token
  if (!token) {
    return res
      .status(401)
      .json({ message: 'You must be log-in to access this page' })
  }

  try {
    const userId = jws.verify(token, JWT_SECRET)
    req.userId = userId
    next()
  } catch (error) {
    return res.status(401).json({ message: error })
  }
}

export default authentication
