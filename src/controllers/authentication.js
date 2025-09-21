import 'dotenv/config'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import User from '../models/user.js'

export const TOKEN_COOKIE_NAME = 'jwt'
const NUMBER_OF_HASH_ROUNDS = 10

export const login = (request, response) => {
  const errorMessage = 'Invalid credentials'

  const { username, password } = request.body // Already validated

  return User.findOne({ username })
    .then((user) => {
      if (!user) {
        return response.status(401).json({ message: errorMessage })
      }
      return bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) {
          return response.status(401).json({ message: errorMessage })
        }
        const token = jwt.sign(
          { id: user._id, username: username },
          process.env.NODE_JS_JWT_SECRET,
          {
            expiresIn: '24h',
          }
        )
        response.cookie(TOKEN_COOKIE_NAME, token, {
          httpOnly: true,
          secure: true,
          sameSite: 'None',
          maxAge: 60 * 60 * 1000, // 1h in ms
          //partitioned: true,
        })
        return response
          .status(200)
          .json({ message: 'Log-in successful', username })
      })
    })
    .catch((error) => {
      console.error('Login error: ' + error)
      return response.status(500).json({ message: 'Internal server error' })
    })
}

export const signup = async (request, response) => {
  try {
    const errorMessage = 'Unauthorized sign-up'

    const { username, password, signupKey } = request.body // Already validated

    // Check sign-up key
    if (signupKey !== process.env.NODE_JS_SIGN_UP_KEY) {
      console.log('Wrong sign-up key')
      return response.status(401).json({ message: errorMessage })
    }

    // Check is user already exist
    const userExist = await User.findOne({ username: username })
    if (userExist) {
      console.log('User already exists: ' + userExist)
      return response.status(401).json({ message: errorMessage })
    }

    const hashedPassword = await bcrypt.hash(password, NUMBER_OF_HASH_ROUNDS)

    const user = new User({
      username: username,
      password: hashedPassword,
    })
    await user.save()

    return response.status(201).json({ message: 'User successfully created' })
  } catch (error) {
    console.error('Error in signup:', error)
    return response.status(500).json({ message: 'Internal server error' })
  }
}

export const me = (request, response) => {
  return response.status(200).json({ user: request.tokenData.username })
}

export const logout = (request, response) => {
  response.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
  })
  response.status(200).json({ message: 'Log-out successful' })
}
