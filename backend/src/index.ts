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
app.use(globalLimiter)

app.get('/api/health', (_req, res) => { res.json({ status: 'ok' }) })
app.use('/api/contact', express.json({ limit: '20kb' }), contactLimiter, contactRouter)
app.use('/api/chat', express.json({ limit: '1mb' }), chatLimiter, chatRouter)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const bodyParserErr = err as Error & { type?: string; status?: number }
  if (bodyParserErr.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' })
  }
  if (bodyParserErr.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' })
  }
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason)
})

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`)
})
