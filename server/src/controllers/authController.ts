import { Request, Response } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { query } from "../db.js"
import { config } from "../config.js"
import { log } from "../utils/logger.js"

interface RegisterBody {
  username:    string
  email:       string
  password:    string
  factoryName: string
}

interface LoginBody {
  email:    string
  password: string
}

export async function register(req: Request<{}, {}, RegisterBody>, res: Response): Promise<void> {
  const { username, email, password, factoryName } = req.body

  try {
    const existing = await query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    )
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "Username or email already taken" })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await query<{ id: number }>(
      `INSERT INTO users (username, email, password_hash, factory_name)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [username, email, passwordHash, factoryName]
    )

    const userId = result.rows[0].id

    // Create default game save
    const saveResult = await query<{ id: number }>(
      "INSERT INTO game_saves (user_id) VALUES ($1) RETURNING id",
      [userId]
    )
    const saveId = saveResult.rows[0].id

    // Seed default slot states
    const defaultSlots = [
      { index: 0, patternId: "square", unlocked: true },
      { index: 1, patternId: null,     unlocked: false },
      { index: 2, patternId: null,     unlocked: false },
      { index: 3, patternId: null,     unlocked: false }
    ]
    for (const slot of defaultSlots) {
      await query(
        `INSERT INTO slot_states (save_id, slot_index, pattern_id, unlocked)
         VALUES ($1, $2, $3, $4)`,
        [saveId, slot.index, slot.patternId, slot.unlocked]
      )
    }

    // Seed default pattern progress
    const patterns = ["square", "triangle", "circle", "cross"]
    for (const patternId of patterns) {
      await query(
        `INSERT INTO pattern_progress (save_id, pattern_id, unlocked)
         VALUES ($1, $2, $3)`,
        [saveId, patternId, patternId === "square"]
      )
    }

    // Email verification token. Until nodemailer is wired up, we surface
    // the token via dev-only log. In production we never log the value;
    // the caller is expected to pull it from the DB or trigger the mailer.
    const verifyToken = crypto.randomBytes(32).toString("hex")
    const expiresAt   = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, verifyToken, expiresAt]
    )

    if (!config.isProd) {
      log.debug("auth.register", "verification token issued (dev only)", { userId, verifyToken })
    }

    const token = jwt.sign(
      { userId, username },
      config.jwtSecret,
      { expiresIn: "7d" }
    )

    log.info("auth.register", "user registered", { userId, username })
    res.status(201).json({
      token,
      user: { id: userId, username, email, factoryName }
    })
  } catch (err) {
    log.error("auth.register", "registration failed", { err, username, email })
    res.status(500).json({ error: "Registration failed" })
  }
}

export async function login(req: Request<{}, {}, LoginBody>, res: Response): Promise<void> {
  const { email, password } = req.body

  try {
    const result = await query<{
      id:            number
      username:      string
      email:         string
      factory_name:  string
      password_hash: string
      verified:      boolean
      is_admin:      boolean
    }>(
      "SELECT * FROM users WHERE email = $1",
      [email]
    )

    if (result.rows.length === 0) {
      // Generic message — don't disclose whether email exists.
      log.info("auth.login", "failed: unknown email", { email })
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    const user  = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      log.info("auth.login", "failed: bad password", { userId: user.id })
      res.status(401).json({ error: "Invalid credentials" })
      return
    }

    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id])

    const token = jwt.sign(
      { userId: user.id, username: user.username, isAdmin: user.is_admin ?? false },
      config.jwtSecret,
      { expiresIn: "7d" }
    )

    log.info("auth.login", "user logged in", { userId: user.id, username: user.username })
    res.json({
      token,
      user: {
        id:          user.id,
        username:    user.username,
        email:       user.email,
        factoryName: user.factory_name,
        isAdmin:     user.is_admin ?? false
      }
    })
  } catch (err) {
    log.error("auth.login", "login error", { err, email })
    res.status(500).json({ error: "Login failed" })
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.params

  try {
    const result = await query<{ user_id: number; expires_at: Date }>(
      "SELECT * FROM email_verification_tokens WHERE token = $1",
      [token]
    )

    if (result.rows.length === 0) {
      res.status(400).json({ error: "Invalid verification token" })
      return
    }

    const record = result.rows[0]
    if (new Date() > record.expires_at) {
      res.status(400).json({ error: "Token expired" })
      return
    }

    await query("UPDATE users SET verified = TRUE WHERE id = $1", [record.user_id])
    await query("DELETE FROM email_verification_tokens WHERE token = $1", [token])

    log.info("auth.verifyEmail", "email verified", { userId: record.user_id })
    res.json({ message: "Email verified successfully" })
  } catch (err) {
    log.error("auth.verifyEmail", "verification failed", { err })
    res.status(500).json({ error: "Verification failed" })
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const authReq = req as { userId?: number }

  try {
    const result = await query<{
      id:           number
      username:     string
      email:        string
      factory_name: string
      verified:     boolean
      is_admin:     boolean
      created_at:   string
    }>(
      "SELECT id, username, email, factory_name, verified, is_admin, created_at FROM users WHERE id = $1",
      [authReq.userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" })
      return
    }

    const u = result.rows[0]
    res.json({
      id:          u.id,
      username:    u.username,
      email:       u.email,
      factoryName: u.factory_name,
      isAdmin:     u.is_admin ?? false,
      verified:    u.verified,
      createdAt:   u.created_at
    })
  } catch (err) {
    log.error("auth.getMe", "lookup failed", { err, userId: authReq.userId })
    res.status(500).json({ error: "Failed to fetch user" })
  }
}
