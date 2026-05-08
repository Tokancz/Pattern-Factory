import { Request, Response, NextFunction } from "express"
import { log }    from "../utils/logger.js"
import { config } from "../config.js"

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log full stack server-side; expose only the message in dev. Production
  // never leaks internal error details to the client.
  log.error("errorHandler", "unhandled error", {
    err,
    method: req.method,
    path:   req.originalUrl
  })
  res.status(500).json({
    error:   "Internal server error",
    details: config.isProd ? undefined : err.message
  })
}
