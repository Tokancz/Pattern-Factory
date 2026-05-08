import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { config } from "../config.js"

export interface AuthRequest extends Request {
  userId?: number
  username?: string
  isAdmin?: boolean
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
    const decoded = jwt.verify(token, config.jwtSecret) as {
      userId:   number
      username: string
      isAdmin:  boolean
    }
    req.userId   = decoded.userId
    req.username = decoded.username
    req.isAdmin  = decoded.isAdmin ?? false
    next()
  } catch {
    res.status(401).json({ error: "Invalid or expired token" })
  }
}

export function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.isAdmin) {
    res.status(403).json({ error: "Admin access required" })
    return
  }
  next()
}
