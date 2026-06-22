import { prisma } from '../lib/prisma.js'

export const findAllSkills = () =>
  prisma.skill.findMany({ orderBy: { order: 'asc' } })

export const findSkillById = (id: number) =>
  prisma.skill.findUnique({ where: { id } })

export const createSkill = (data: Parameters<typeof prisma.skill.create>[0]['data']) =>
  prisma.skill.create({ data })

export const updateSkill = (id: number, data: Parameters<typeof prisma.skill.update>[0]['data']) =>
  prisma.skill.update({ where: { id }, data })

export const removeSkill = (id: number) =>
  prisma.skill.delete({ where: { id } })
