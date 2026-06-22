import { prisma } from '../lib/prisma.js'

export const findAllProjects = () =>
  prisma.project.findMany({ orderBy: { order: 'asc' } })

export const findProjectById = (id: number) =>
  prisma.project.findUnique({ where: { id } })

export const createProject = (data: Parameters<typeof prisma.project.create>[0]['data']) =>
  prisma.project.create({ data })

export const updateProject = (id: number, data: Parameters<typeof prisma.project.update>[0]['data']) =>
  prisma.project.update({ where: { id }, data })

export const removeProject = (id: number) =>
  prisma.project.delete({ where: { id } })
