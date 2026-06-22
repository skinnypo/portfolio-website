import { Router } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { findAllSkills, createSkill, updateSkill, removeSkill } from '../../repositories/skill.js'

const router = Router()

const SkillSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
  order: z.number().int().default(0),
})

router.get('/', async (_req, res, next) => {
  try {
    res.json(await findAllSkills())
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const result = SkillSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.flatten() })
      return
    }
    res.status(201).json(await createSkill(result.data))
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const result = SkillSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.flatten() })
      return
    }
    res.json(await updateSkill(id, result.data))
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
    await removeSkill(parseInt(req.params.id))
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
