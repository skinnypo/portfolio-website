import { prisma } from '../lib/prisma.js'

export const findBio = () => prisma.bio.findUnique({ where: { id: 1 } })

export const updateBio = (data: Parameters<typeof prisma.bio.update>[0]['data']) =>
  prisma.bio.update({ where: { id: 1 }, data })
