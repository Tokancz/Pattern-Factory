import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export interface AuthRequest extends Request {
  userId?: number
  username?: string
}

export function verifyToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" })
    return
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "fallback_secret") as {
      userId: number
      username: string
    }
    req.userId   = decoded.userId
    req.username = decoded.username
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}