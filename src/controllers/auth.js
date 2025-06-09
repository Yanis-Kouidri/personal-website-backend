import 'dotenv/config'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import User from '../models/user.js'

const NODE_JS_JWT_SECRET = process.env.NODE_JS_JWT_SECRET
export const TOKEN_COOKIE_NAME = 'jwt'

const validateSignupInputs = (body) => {
  const { username, password, signupKey } = body
  if (!username || !password || !signupKey) {
    return 'All fields are required: username, password, and signupKey'
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }
  return null
}

export const login = (req, res) => {
  const errorMessage = 'Invalid credentials'
  const { username, password } = req.body

  User.findOne({ username })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ message: errorMessage })
      }
      bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) {
          return res.status(401).json({ message: errorMessage })
        }
        const token = jwt.sign(
          { id: user._id, username: username },
          NODE_JS_JWT_SECRET,
          {
            expiresIn: '24h',
          }
        )
        res.cookie(TOKEN_COOKIE_NAME, token, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          maxAge: 3600000, // 1h
          partitioned: true,
        })
        return res.status(200).json({ message: 'Log-in successful', username })
      })
    })
    .catch((error) => {
      console.err('Login error: ' + error)
      return res.status(500).json({ message: 'Internal server error' })
    })
}

export const signup = async (req, res) => {
  try {
    const errorMessage = 'Unauthorized sign-up'
    const signupKey = process.env.NODE_JS_SIGN_UP_KEY

    // Fields validation
    const validationError = validateSignupInputs(req.body)
    if (validationError) {
      return res.status(400).json({ message: validationError })
    }

    // Check sign-up key
    if (req.body.signupKey !== signupKey) {
      console.log('Wrong sign-up key')
      return res.status(401).json({ message: errorMessage })
    }

    // Check is user already exist
    const userExist = await User.findOne({ username: req.body.username })
    if (userExist) {
      console.log('User already exists: ' + userExist)
      return res.status(401).json({ message: errorMessage })
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    })
    await user.save()

    return res.status(201).json({ message: 'User successfully created' })
  } catch (error) {
    console.error('Error in signup: ', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}

export const me = (req, res) => {
  return res.status(200).json({ user: req.tokenData.username })
}

export const logout = (req, res) => {
  res.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
  })
  res.status(200).json({ message: 'Log-out successful' })
}
