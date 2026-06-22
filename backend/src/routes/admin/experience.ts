import { Router } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { findAllExperience, createExperience, updateExperience, removeExperience } from '../../repositories/experience.js'

const router = Router()

const ExperienceSchema = z.object({
  position: z.string().min(1),
  company: z.string().min(1),
  period: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  responsibilities: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  order: z.number().int().default(0),
})

router.get('/', async (_req, res, next) => {
  try {
    res.json(await findAllExperience())
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const result = ExperienceSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.flatten() })
      return
    }
    res.status(201).json(await createExperience(result.data))
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const result = ExperienceSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.flatten() })
      return
    }
    res.json(await updateExperience(id, result.data))
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: 'Not found' })
      return
    }
    next(err)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await removeExperience(parseInt(req.params.id))
    res.status(204).send()
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      res.status(404).json({ error: 'Not found' })
      return
    }
    next(err)
  }
})

export default router
