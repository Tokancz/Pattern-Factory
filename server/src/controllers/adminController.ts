import { Response } from "express"
import { AuthRequest } from "../middleware/auth.js"
import { query } from "../db.js"

interface UserRow {
  id: number
  username: string
  email: string
  factory_name: string
  is_admin: boolean
  created_at: string
  last_login: string
}

interface SaveRow {
  money: number
  dc: number
  prestige_points: number
  level: number
  exp: number
  unlocked_slots: number
  glyphs: number
  pending_glyphs: number
  glyph_pattern_count: number
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
    console.error(err)
    res.status(500).json({ error: "Failed to fetch users" })
  }
}

// GET /admin/users/:id
export async function getUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params
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
      id: u.id,
      username: u.username,
      email: u.email,
      factoryName: u.factory_name,
      isAdmin: u.is_admin,
      createdAt: u.created_at,
      lastLogin: u.last_login,
      save: saveResult.rows[0] ?? null
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to fetch user" })
  }
}

// PATCH /admin/users/:id/save  — alter game currency/progression values
export async function patchUserSave(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params
  const { money, dc, prestige_points, level, exp, glyphs, pending_glyphs, glyph_pattern_count } = req.body

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
        money ?? null,
        dc ?? null,
        prestige_points ?? null,
        level ?? null,
        exp ?? null,
        glyphs ?? null,
        pending_glyphs ?? null,
        glyph_pattern_count ?? null,
        id
      ]
    )
    res.json({ message: "Save updated" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update save" })
  }
}

// PATCH /admin/users/:id  — promote / demote admin
export async function patchUser(req: AuthRequest, res: Response): Promise<void> {
  const { id } = req.params
  const { isAdmin } = req.body

  // Prevent self-demotion
  if (req.userId === Number(id) && isAdmin === false) {
    res.status(400).json({ error: "Cannot remove your own admin rights" })
    return
  }

  try {
    await query(
      `UPDATE users SET is_admin = $1 WHERE id = $2`,
      [isAdmin, id]
    )
    res.json({ message: "User updated" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to update user" })
  }
}
