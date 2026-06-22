import { Router } from 'express'
import { z } from 'zod'
import * as argon2 from 'argon2'
import { SignJWT } from 'jose'
import { prisma } from '../../lib/prisma.js'

const router = Router()

const LoginSchema = z.object({ password: z.string().min(1) })

router.post('/login', async (req, res, next) => {
  try {
    const result = LoginSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input' })
      return
    }

    const credential = await prisma.adminCredential.findUnique({ where: { id: 1 } })
    if (!credential) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const valid = await argon2.verify(credential.passwordHash, result.data.password)
    if (!valid) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '')
    const token = await new SignJWT({ admin: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret)

    res.json({ token })
  } catch (err) {
    next(err)
  }
})

export default router
