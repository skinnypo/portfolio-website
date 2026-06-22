import { Router } from 'express'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { findAllProjects, createProject, updateProject, removeProject } from '../../repositories/project.js'

const router = Router()

const ProjectSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  technologies: z.string().min(1),
  image: z.string().url().optional().nullable(),
  description: z.string().min(1),
  order: z.number().int().default(0),
})

router.get('/', async (_req, res, next) => {
  try {
    res.json(await findAllProjects())
  } catch (err) { next(err) }
})

router.post('/', async (req, res, next) => {
  try {
    const result = ProjectSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.flatten() })
      return
    }
    const project = await createProject(result.data)
    res.status(201).json(project)
  } catch (err) { next(err) }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id)
    const result = ProjectSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input', details: result.error.flatten() })
      return
    }
    res.json(await updateProject(id, result.data))
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
    await removeProject(parseInt(req.params.id))
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
