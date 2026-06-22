import { Router } from 'express'
import { z } from 'zod'
import * as argon2 from 'argon2'
import { createHash, randomInt } from 'crypto'
import { SignJWT } from 'jose'
import nodemailer from 'nodemailer'
import { prisma } from '../../lib/prisma.js'

const router = Router()

const LoginSchema = z.object({ password: z.string().min(1) })
const OtpSchema = z.object({ otp: z.string().length(6) })

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

async function sendOtpEmail(otp: string): Promise<void> {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  const adminEmail = process.env.ADMIN_EMAIL ?? user
  if (!user || !pass || !adminEmail) throw new Error('Email credentials not configured')

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { type: 'login', user, pass },
  })

  await transporter.sendMail({
    from: user,
    to: adminEmail,
    subject: 'Admin login OTP',
    text: `Your one-time login code is: ${otp}\n\nExpires in 5 minutes. Do not share this code.`,
  })
}

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

    const otp = String(randomInt(100000, 999999))
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.otpChallenge.upsert({
      where: { id: 1 },
      update: { otpHash: hashOtp(otp), expiresAt },
      create: { id: 1, otpHash: hashOtp(otp), expiresAt },
    })

    await sendOtpEmail(otp)

    res.json({ otpRequired: true })
  } catch (err) {
    next(err)
  }
})

router.post('/verify-otp', async (req, res, next) => {
  try {
    const result = OtpSchema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: 'Invalid input' })
      return
    }

    const challenge = await prisma.otpChallenge.findUnique({ where: { id: 1 } })
    if (!challenge || challenge.expiresAt < new Date()) {
      await prisma.otpChallenge.deleteMany({ where: { id: 1 } })
      res.status(401).json({ error: 'OTP expired or not found' })
      return
    }

    if (hashOtp(result.data.otp) !== challenge.otpHash) {
      res.status(401).json({ error: 'Invalid OTP' })
      return
    }

    await prisma.otpChallenge.delete({ where: { id: 1 } })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '')
    const token = await new SignJWT({ admin: true })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(secret)

    res.json({ token })
  } catch (err) {
    next(err)
  }
})

export default router
