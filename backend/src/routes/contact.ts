import { Router } from 'express'
import nodemailer from 'nodemailer'
import { z } from 'zod'

const router = Router()

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  subject: z.string().min(1).max(200),
  company: z.string().max(100).optional(),
  message: z.string().min(1).max(5000),
  turnstileToken: z.string().min(1),
})

async function verifyCaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY not set — skipping CAPTCHA verification')
    return true
  }
  const body = new URLSearchParams({ secret: secretKey, response: token })
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  })
  const data = (await res.json()) as { success: boolean }
  return data.success
}

function createTransporter() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) throw new Error('Gmail credentials not configured')
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { type: 'login', user, pass },
  })
}

router.post('/', async (req, res, next) => {
  try {
    const result = contactSchema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid input' })
    }

    const { name, email, subject, company, message, turnstileToken } = result.data

    const captchaOk = await verifyCaptcha(turnstileToken)
    if (!captchaOk) {
      return res.status(400).json({ error: 'CAPTCHA verification failed' })
    }

    const gmailUser = process.env.GMAIL_USER
    if (!gmailUser) {
      return res.status(500).json({ error: 'Email not configured' })
    }

    const lines = [
      `Name: ${name}`,
      company ? `Company: ${company}` : null,
      `Email: ${email}`,
      '',
      message,
    ].filter((l): l is string => l !== null)

    await createTransporter().sendMail({
      from: gmailUser,
      to: gmailUser,
      replyTo: email,
      subject: `[Portfolio Contact] ${subject}`,
      text: lines.join('\n'),
    })

    return res.status(200).json({ ok: true })
  } catch (err) {
    next(err)
  }
})

export default router
