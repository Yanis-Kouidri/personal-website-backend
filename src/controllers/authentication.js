import argon2 from 'argon2'
import { SignJWT } from 'jose'

import User from '../models/user.js'

export const TOKEN_COOKIE_NAME = 'jwt'

// OWASP recommended config for Argon2id
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3, // 3 iterations
  parallelism: 1, // 1 thread
}

export const login = async (request, response) => {
  try {
    const { username, password } = request.body
    const user = await User.findOne({ username })

    if (!user || !(await argon2.verify(user.password, password))) {
      return response.status(401).json({ message: 'Invalid credentials' })
    }

    const secret = new TextEncoder().encode(process.env.NODE_JS_JWT_SECRET)

    const token = await new SignJWT({ id: user._id, username: username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    response.cookie(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 60 * 60 * 1000,
    })

    return response.status(200).json({ message: 'Log-in successful', username })
  } catch (error) {
    // Un log plus professionnel pour la production
    console.error(`[Auth-Login-Error]: ${error.message}`, {
      stack: error.stack,
    })
    return response.status(500).json({ message: 'Internal server error' })
  }
}

export const signup = async (request, response) => {
  try {
    const errorMessage = 'Unauthorized sign-up'
    const { username, password, signupKey } = request.body

    if (signupKey !== process.env.NODE_JS_SIGN_UP_KEY) {
      return response.status(401).json({ message: errorMessage })
    }

    const userExist = await User.findOne({ username })
    if (userExist) {
      return response.status(401).json({ message: errorMessage })
    }

    const hashedPassword = await argon2.hash(password, ARGON2_OPTIONS)

    const user = new User({
      username,
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

export const logout = (_request, response) => {
  response.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
  })
  response.status(200).json({ message: 'Log-out successful' })
}
