import { Response } from "express"
import { AuthRequest } from "../middleware/auth.js"
import { query } from "../db.js"
import { log }   from "../utils/logger.js"

interface UserRow {
  id:           number
  username:     string
  email:        string
  factory_name: string
  is_admin:     boolean
  created_at:   string
  last_login:   string
}

interface SaveRow {
  money:               number
  dc:                  number
  prestige_points:     number
  level:               number
  exp:                 number
  unlocked_slots:      number
  glyphs:              number
  pending_glyphs:      number
  glyph_pattern_count: number
}

// Reject NaN/Infinity/negatives — these would corrupt downstream math and
// the leaderboard ranking. `undefined` passes through (we use COALESCE in
// the UPDATE so unset fields keep their existing values).
function optionalNonNeg(value: unknown, field: string): { error?: string; value: number | null } {
  if (value === undefined || value === null) return { value: null }
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return { error: `${field} must be a finite, non-negative number`, value: null }
  }
  return { value }
}

// Coerce and validate `:id` once per request — it comes from the URL as a
// string and is unsafe to plug into queries without confirming it's a real
// positive integer.
function parseId(raw: string): number | null {
  const id = Number(raw)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

// GET /admin/users
export async function listUsers(_req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await query<UserRow>(
      `SELECT id, username, email, factory_name, is_admin, created_at, last_login
       FROM users ORDER BY id ASC`
    )
    res.json(result.rows)
  } catch (err) {
    log.error("admin.listUsers", "fetch failed", { err })
    res.status(500).json({ error: "Failed to fetch users" })
  }
}

// GET /admin/users/:id
export async function getUser(req: AuthRequest, res: Response): Promise<void> {
  const id = parseId(req.params.id)
  if (id === null) { res.status(400).json({ error: "Invalid user id" }); return }

  try {
    const userResult = await query<UserRow>(
      `SELECT id, username, email, factory_name, is_admin, created_at, last_login
       FROM users WHERE id = $1`,
      [id]
    )
    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" })
      return
    }

    const saveResult = await query<SaveRow>(
      `SELECT money, dc, prestige_points, level, exp, unlocked_slots,
              glyphs, pending_glyphs, glyph_pattern_count
       FROM game_saves WHERE user_id = $1`,
      [id]
    )

    const u = userResult.rows[0]
    res.json({
      id:          u.id,
      username:    u.username,
      email:       u.email,
      factoryName: u.factory_name,
      isAdmin:     u.is_admin,
      createdAt:   u.created_at,
      lastLogin:   u.last_login,
      save:        saveResult.rows[0] ?? null
    })
  } catch (err) {
    log.error("admin.getUser", "fetch failed", { err, targetId: id })
    res.status(500).json({ error: "Failed to fetch user" })
  }
}

// PATCH /admin/users/:id/save  — alter game currency/progression values
export async function patchUserSave(req: AuthRequest, res: Response): Promise<void> {
  const id = parseId(req.params.id)
  if (id === null) { res.status(400).json({ error: "Invalid user id" }); return }

  const fields = ["money", "dc", "prestige_points", "level", "exp",
                  "glyphs", "pending_glyphs", "glyph_pattern_count"] as const
  const values: Record<typeof fields[number], number | null> = {} as any

  for (const field of fields) {
    const { error, value } = optionalNonNeg(req.body[field], field)
    if (error) { res.status(400).json({ error }); return }
    values[field] = value
  }

  try {
    await query(
      `UPDATE game_saves SET
         money               = COALESCE($1, money),
         dc                  = COALESCE($2, dc),
         prestige_points     = COALESCE($3, prestige_points),
         level               = COALESCE($4, level),
         exp                 = COALESCE($5, exp),
         glyphs              = COALESCE($6, glyphs),
         pending_glyphs      = COALESCE($7, pending_glyphs),
         glyph_pattern_count = COALESCE($8, glyph_pattern_count),
         save_version        = save_version + 1
       WHERE user_id = $9`,
      [
        values.money, values.dc, values.prestige_points,
        values.level, values.exp, values.glyphs,
        values.pending_glyphs, values.glyph_pattern_count,
        id
      ]
    )
    log.info("admin.patchSave", "save patched", { adminId: req.userId, targetId: id })
    res.json({ message: "Save updated" })
  } catch (err) {
    log.error("admin.patchSave", "patch failed", { err, adminId: req.userId, targetId: id })
    res.status(500).json({ error: "Failed to update save" })
  }
}

// PATCH /admin/users/:id  — promote / demote admin
export async function patchUser(req: AuthRequest, res: Response): Promise<void> {
  const id = parseId(req.params.id)
  if (id === null) { res.status(400).json({ error: "Invalid user id" }); return }

  const { isAdmin } = req.body
  if (typeof isAdmin !== "boolean") {
    res.status(400).json({ error: "isAdmin must be a boolean" })
    return
  }

  // Prevent self-demotion — guards against an admin accidentally locking
  // every operator out of the admin panel.
  if (req.userId === id && isAdmin === false) {
    res.status(400).json({ error: "Cannot remove your own admin rights" })
    return
  }

  try {
    await query(`UPDATE users SET is_admin = $1 WHERE id = $2`, [isAdmin, id])
    log.info("admin.patchUser", "admin status changed", {
      adminId: req.userId, targetId: id, isAdmin
    })
    res.json({ message: "User updated" })
  } catch (err) {
    log.error("admin.patchUser", "patch failed", { err, adminId: req.userId, targetId: id })
    res.status(500).json({ error: "Failed to update user" })
  }
}
