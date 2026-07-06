import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { globalLimiter, chatLimiter, contactLimiter } from './middleware/rateLimiter.js'
import contactRouter from './routes/contact.js'
import chatRouter from './routes/chat.js'

const app = express()
const port = process.env.PORT ?? 3000

const allowedOrigins = (process.env.ALLOW_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.set('trust proxy', 1)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())
app.use(globalLimiter)

app.get('/api/health', (_req, res) => { res.json({ status: 'ok' }) })
app.use('/api/contact', contactLimiter, contactRouter)
app.use('/api/chat', chatLimiter, chatRouter)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
