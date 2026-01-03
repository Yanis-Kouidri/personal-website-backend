import process from 'node:process'
import argon2 from 'argon2'
import { SignJWT } from 'jose'
import User from '../models/user.js'

/**
 * Cookie configuration constant to ensure consistency across login/logout
 */
export const TOKEN_COOKIE_NAME = 'jwt'

// OWASP recommended configuration for Argon2id
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3, // 3 iterations
  parallelism: 1, // 1 thread
}

/**
 * Handle user login and JWT issuance
 */
export const login = async (request, response) => {
  try {
    const { username, password } = request.body

    // 1. Find user and verify password
    const user = await User.findOne({ username })
    const isValidPassword = user
      ? await argon2.verify(user.password, password)
      : false

    if (!isValidPassword) {
      // Use a generic message to prevent username enumeration
      return response
        .status(401)
        .json({ message: 'Invalid username or password' })
    }

    // 2. Generate JWT
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const token = await new SignJWT({
      id: user._id,
      username: user.username,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    // 3. Set Secure Cookie
    response.cookie(TOKEN_COOKIE_NAME, token, {
      httpOnly: true, // Prevents XSS attacks
      secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
      sameSite: 'Lax', // Protects against CSRF
      maxAge: 24 * 60 * 60 * 1000, // 24 hours (matches JWT expiration)
      path: '/',
    })

    return response.status(200).json({
      message: 'Login successful',
      user: { username: user.username },
    })
  } catch (error) {
    console.error(`[Auth-Login-Error]: ${error.message}`)
    return response.status(500).json({ message: 'Internal server error' })
  }
}

/**
 * Secure signup with an invitation key
 */
export const signup = async (request, response) => {
  try {
    const { username, password, signupKey } = request.body

    // Protection for private/invite-only repositories
    if (!signupKey || signupKey !== process.env.SIGNUP_KEY) {
      return response
        .status(403)
        .json({ message: 'Invalid or missing signup key' })
    }

    const userExists = await User.findOne({ username })
    if (userExists) {
      return response.status(409).json({ message: 'Username already taken' })
    }

    const hashedPassword = await argon2.hash(password, ARGON2_OPTIONS)

    const newUser = new User({
      username,
      password: hashedPassword,
    })

    await newUser.save()

    return response.status(201).json({ message: 'User successfully created' })
  } catch (error) {
    console.error(`[Auth-Signup-Error]: ${error.message}`)
    return response.status(500).json({ message: 'Internal server error' })
  }
}

/**
 * Get current authenticated user details
 */
export const me = (request, response) => {
  // Access request.user populated by the authentication middleware
  if (!request.user) {
    return response.status(401).json({ message: 'Not authenticated' })
  }
  return response.status(200).json({ user: request.user })
}

/**
 * Clear the authentication cookie
 */
export const logout = (_request, response) => {
  response.clearCookie(TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
  })

  return response.status(200).json({ message: 'Logout successful' })
}
