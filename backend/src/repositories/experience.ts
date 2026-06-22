import { prisma } from '../lib/prisma.js'

export const findAllExperience = () =>
  prisma.experience.findMany({ orderBy: { order: 'asc' } })

export const findExperienceById = (id: number) =>
  prisma.experience.findUnique({ where: { id } })

export const createExperience = (data: Parameters<typeof prisma.experience.create>[0]['data']) =>
  prisma.experience.create({ data })

export const updateExperience = (id: number, data: Parameters<typeof prisma.experience.update>[0]['data']) =>
  prisma.experience.update({ where: { id }, data })

export const removeExperience = (id: number) =>
  prisma.experience.delete({ where: { id } })
