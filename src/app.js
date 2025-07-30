import path from 'node:path'

import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'

import authentication from './middlewares/authentication.js'
import authenticationRoutes from './routes/authentication.js'
import documentationRoutes from './routes/documentation.js'
import checkEnvironmentVariables from './utils/validate-environment-variables.js'

const dirname = import.meta.dirname

const app = express()

app.disable('x-powered-by') // Avoid information disclosure

app.use(express.json())

app.use((error, request, response, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('Malformed JSON:', error.message)
    return response.status(400).json({ message: 'Invalid JSON' })
  }
  next(error)
})

app.use(cookieParser())

//console.log('Env variables: ' + JSON.stringify(process.env, null, 2))
checkEnvironmentVariables()

let mongodbUrl = 'mongodb://'

if (
  process.env.NODE_JS_MONGODB_USERNAME &&
  process.env.NODE_JS_MONGODB_PASSWORD
) {
  mongodbUrl +=
    process.env.NODE_JS_MONGODB_USERNAME +
    ':' +
    process.env.NODE_JS_MONGODB_PASSWORD +
    '@'
}

mongodbUrl +=
  process.env.NODE_JS_MONGODB_ADDRESS +
  ':' +
  process.env.NODE_JS_MONGODB_PORT +
  '/' +
  process.env.NODE_JS_MONGODB_DATABASE

console.log('Mongodb URI: ' + mongodbUrl)

try {
  await mongoose.connect(mongodbUrl)
  console.log('Connection to mongodb database successed')
} catch (error) {
  console.error('Connexion failed: ' + error)
}

const cors_origin =
  process.env.NODE_JS_FRONTEND_URL +
  (process.env.NODE_JS_FRONTEND_PORT
    ? ':' + process.env.NODE_JS_FRONTEND_PORT
    : '')

console.log('CORS origin: ' + cors_origin)

const corsOptions = {
  origin: cors_origin,

  methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
  allowedHeaders:
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization',
  credentials: true,
}

app.use(cors(corsOptions))

app.use('/api/docs', documentationRoutes)
app.use('/api/auth', authenticationRoutes)

app.use('/data/docs', express.static(path.join(dirname, '../data/docs')))

app.get('/protected-route', authentication, (request, response) => {
  response.json({ message: 'Access granted', user: request.user })
})

export default app
