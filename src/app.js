import path from 'node:path'
import process from 'node:process'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'

import authentication from './middlewares/authentication.js'
import jsonErrorHandler from './middlewares/json-error-handler.js'
import authenticationRoutes from './routes/authentication.js'
import documentationRoutes from './routes/documentation.js'
import checkEnvironmentVariables from './utils/validate-environment-variables.js'

const dirname = import.meta.dirname
const app = express()

/**
 * Global Security & Initialization
 */
checkEnvironmentVariables()
app.use(helmet()) // Sets various HTTP headers for security
app.disable('x-powered-by') // Hide Express fingerprint

// Add this in app.js before applying any rate limiters
app.set('trust proxy', 1)

/**
 * Standard Middlewares
 */
app.use(express.json({ limit: '10kb' })) // Limit body size to prevent DoS
app.use(cookieParser())

/**
 * Database Connection
 * Use a single URI string for reliability and security.
 */
const mongodbUri = process.env.MONGODB_URI

try {
  // Database connection with top-level await (Node 24 ESM)
  await mongoose.connect(mongodbUri)
  console.info('Connected to MongoDB database')
} catch (error) {
  console.error('Database connection failed. Exiting...')
  if (process.env.NODE_ENV === 'development') {
    console.error(error)
  }
  process.exit(1) // Stop the server if DB is unreachable
}

/**
 * CORS Configuration
 * Using a function instead of a string to strictly validate origins.
 */
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigin = process.env.ALLOWED_ORIGIN

    // 1. Allow requests with no origin (like mobile apps, curl, or Postman)
    // 2. Check if the incoming origin matches our allowed origin
    if (!origin || origin === allowedOrigin) {
      callback(null, true)
    } else {
      // Return false to omit the Access-Control-Allow-Origin header
      callback(null, false)
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content',
    'Accept',
    'Content-Type',
    'Authorization',
  ],
  credentials: true,
}

app.use(cors(corsOptions))

/**
 * Routes
 */
app.use('/api/auth', authenticationRoutes)
app.use('/api/docs', documentationRoutes)

// Static files
app.use('/data/docs', express.static(path.join(dirname, '../data/docs')))

/**
 * Protected Routes
 */
app.get('/protected-route', authentication, (req, res) => {
  res.json({ message: 'Access granted', user: req.user })
})

/**
 * Error Handling
 * IMPORTANT: Error handlers must be defined last.
 */
app.use(jsonErrorHandler)

export default app
