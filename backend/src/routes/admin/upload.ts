import { Router, Request, Response } from 'express'
import { createHash } from 'crypto'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import multer from 'multer'

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? '/uploads'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
})

const router = Router()

router.post('/', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file provided' })
    return
  }

  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })

  const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg'
  const hash = createHash('sha256').update(req.file.buffer).digest('hex').slice(0, 24)
  const filename = `${hash}${ext}`

  writeFileSync(path.join(UPLOAD_DIR, filename), req.file.buffer)

  res.json({ path: `/uploads/${filename}` })
})

export default router
