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

let mongodbUrl = 'mongodb://'

if (process.env.MONGODB_USERNAME && process.env.MONGODB_PASSWORD) {
  mongodbUrl +=
    process.env.MONGODB_USERNAME + ':' + process.env.MONGODB_PASSWORD + '@'
}

mongodbUrl +=
  process.env.MONGODB_ADDRESS +
  ':' +
  process.env.MONGODB_PORT +
  '/' +
  process.env.MONGODB_DATABASE

mongoose
  .connect(mongodbUrl)
  .then(() => console.log('Connection to mongodb database successed'))
  .catch((error) => console.error('Connexion failed: ' + error))

const corsOptions = {
  origin:
    process.env.FRONTEND_URL +
    (process.env.FRONTEND_PORT ? ':' + process.env.FRONTEND_PORT : ''),
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
