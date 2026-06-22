import { Router } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { findBio, updateBio } from '../../repositories/bio.js'

const router = Router()

const BioSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  aboutDescription: z.string().min(1),
  location: z.string().min(1),
  email: z.string().email(),
  github: z.string().url(),
  linkedin: z.string().url(),
  twitter: z.string().url().optional().nullable(),
  facebook: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  photo: z.string().optional().nullable(),
})

router.get('/', async (_req, res, next) => {
  try {
    const bio = await findBio()
    res.json(bio)
  } catch (err) {
    next(err)
  }
})

router.put('/', async (req, res, next) => {
  try {
    const result = BioSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.flatten() })
      return
    }
    const bio = await updateBio(result.data)
    res.json(bio)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: 'Not found' })
      return
    }
    next(err)
  }
})

export default router
