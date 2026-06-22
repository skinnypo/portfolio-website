import { Request, Response, NextFunction } from 'express'
import { jwtVerify } from 'jose'

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? '')

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }
  try {
    await jwtVerify(header.slice(7), secret())
    next()
  } catch {
    res.status(401).json({ error: 'Unauthorized' })
  }
}
