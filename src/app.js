import express from 'express'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import docsRoutes from './routes/docs.js'
import authRoutes from './routes/auth.js'
import authentication from './middlewares/authentication.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())
app.use(cookieParser())

console.log('Env variables: ' + JSON.stringify(process.env, null, 2))

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

mongoose
  .connect(mongodbUrl)
  .then(() => console.log('Connection to mongodb database successed'))
  .catch((error) => console.error('Connexion failed: ' + error))

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

app.use('/api/docs', docsRoutes)
app.use('/api/auth', authRoutes)

app.use('/data/docs', express.static(path.join(__dirname, '../data/docs')))

app.get('/protected-route', authentication, (req, res) => {
  res.json({ message: 'Access granted', user: req.user })
})

export default app
