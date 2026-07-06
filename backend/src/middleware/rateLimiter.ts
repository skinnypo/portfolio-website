import rateLimit from 'express-rate-limit'

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

// Chat calls hit Gemini API — cap per IP to avoid abuse
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Slow down, stranger. Try again in a moment.' },
})

// Contact sends email — one per minute is plenty
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many contact requests, please try again later' },
})
