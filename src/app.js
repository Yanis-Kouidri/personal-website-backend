import express from 'express'
import mongoose from 'mongoose'
import path from 'path'
import { fileURLToPath } from 'url'
import docsRoutes from './routes/docs.js'
import authRoutes from './routes/auth.js'
import authentication from './middlewares/authentication.js'
import cookieParser from 'cookie-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(express.json())
app.use(cookieParser())

let mongodbUrl = 'mongodb://'

if (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD) {
  mongodbUrl +=
    +process.env.MONGODB_USERNAME + ':' + process.env.MONGODB_PASSWORD + '@'
}

mongodbUrl +=
  process.env.MONGODB_ADDRESS +
  ':' +
  process.env.MONGODB_PORT +
  '/' +
  process.env.MONGODB_DATABASE

mongoose
  .connect(mongodbUrl)
  .then(() => console.log('Connexion to mongodb database success'))
  .catch((error) => console.error('Connexion failed: ' + error))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  )
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Credentials', 'true') // Autoriser les credentials (cookies)
  next()
})

app.use('/api/docs', docsRoutes)
app.use('/api/auth', authRoutes)

app.use('/data/docs', express.static(path.join(__dirname, '../data/docs')))

app.get('/protected-route', authentication, (req, res) => {
  res.json({ message: 'Access granted', user: req.user })
})

export default app
