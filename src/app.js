import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import docsRoutes from './routes/docs.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization'
  )
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  )
  next()
})

app.use('/api/docs', docsRoutes)

app.use('/data/docs', express.static(path.join(__dirname, '../data/docs')))

export default app
