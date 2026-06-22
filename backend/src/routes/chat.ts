import { Router, NextFunction, Request, Response } from 'express'
import { z } from 'zod'

const router = Router()

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(50),
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const result = chatSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid input' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing GEMINI_API_KEY' })
  }

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: result.data.messages,
        model: 'gemini-2.0-flash',
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      let errMessage = 'Gemini API error'
      try { errMessage = JSON.parse(errText)?.error?.message || errMessage } catch {}
      return res.status(response.status).json({ error: errMessage })
    }

    const data = await response.json()
    return res.json(data)
  } catch (err) {
    next(err)
  }
})

export default router
