import dotenv from "dotenv"
import crypto from "crypto"
import { log } from "./utils/logger.js"

dotenv.config()

// Hard-fail at startup if the JWT secret is missing. Previously the code
// fell back to the literal string `"fallback_secret"` — that meant any
// deployment without JWT_SECRET set would issue tokens signed with a
// publicly-known string, allowing trivial token forgery. Better to crash
// loudly at boot than to silently issue forgeable tokens.
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.length < 16) {
    log.error("config", `missing or weak ${name} (need ≥16 chars)`)
    process.exit(1)
  }
  return value
}

// In dev we don't require a 16-char secret — but we still warn and fall
// back to a process-local random value so each restart invalidates old
// tokens. Production (NODE_ENV=production) calls requireEnv strictly.
function jwtSecretFromEnv(): string {
  if (process.env.NODE_ENV === "production") return requireEnv("JWT_SECRET")
  const fromEnv = process.env.JWT_SECRET
  if (fromEnv && fromEnv.length >= 16) return fromEnv
  log.warn("config", "JWT_SECRET missing/weak — using ephemeral dev secret")
  // Random per-process secret; old tokens won't validate after restart.
  return crypto.randomBytes(32).toString("hex")
}

export const config = {
  jwtSecret:      jwtSecretFromEnv(),
  frontendOrigin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  port:           Number(process.env.PORT ?? 3001),
  isProd:         process.env.NODE_ENV === "production"
}
