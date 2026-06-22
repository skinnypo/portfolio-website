import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { authMiddleware } from './middleware/auth.js'
import authRouter from './routes/admin/auth.js'
import bioRouter from './routes/admin/bio.js'
import projectsRouter from './routes/admin/projects.js'
import experienceRouter from './routes/admin/experience.js'
import skillsRouter from './routes/admin/skills.js'
import uploadRouter from './routes/admin/upload.js'
import contactRouter from './routes/contact.js'
import chatRouter from './routes/chat.js'

const app = express()
const port = process.env.PORT ?? 3000

const allowedOrigins = (process.env.ALLOW_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())

app.get('/api/health', (_req, res) => { res.json({ status: 'ok' }) })
app.use('/api/contact', contactRouter)
app.use('/api/chat', chatRouter)

app.use('/api/admin', authRouter)
app.use('/api/admin/bio', authMiddleware, bioRouter)
app.use('/api/admin/projects', authMiddleware, projectsRouter)
app.use('/api/admin/experience', authMiddleware, experienceRouter)
app.use('/api/admin/skills', authMiddleware, skillsRouter)
app.use('/api/admin/upload', authMiddleware, uploadRouter)

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
