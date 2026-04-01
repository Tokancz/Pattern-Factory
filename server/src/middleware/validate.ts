import { Request, Response, NextFunction } from "express"

export function validateBody(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        res.status(400).json({ error: `Missing required field: ${field}` })
        return
      }
    }
    next()
  }
}