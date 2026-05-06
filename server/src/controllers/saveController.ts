import { Request, Response } from "express"
import { query } from "../db.js"
import { AuthRequest } from "../middleware/auth.js"

interface SlotStatePayload {
  slotIndex: number
  patternId: string | null
  progress: number
  unlocked: boolean
  speedMultiplier: number
  outputMultiplier: number
}
interface UpgradeLevelPayload {
  upgradeId: string
  level: number
  upgradeType: "normal" | "dc" | "prestige"
}

interface MachineLevelPayload {
  machineId: string
  level: number
}

interface PatternProgressPayload {
  patternId: string
  level: number
  exp: number
  unlocked: boolean
}

interface SavePayload {
  money: number
  dc: number
  prestigePoints: number
  pendingPrestigePoints: number
  level: number
  exp: number
  unlockedSlots: number
  lastPlayed: number
  saveVersion: number
  slots: SlotStatePayload[]
  upgrades: UpgradeLevelPayload[]
  machines: MachineLevelPayload[]
  patterns: PatternProgressPayload[]
}

export async function getSave(req: AuthRequest, res: Response): Promise<void> {
  try {
    const saveResult = await query<{
      id: number; money: number; dc: number
      prestige_points: number; pending_prestige_points: number
      level: number; exp: number
      unlocked_slots: number; last_played: number; save_version: number
    }>(
      "SELECT * FROM game_saves WHERE user_id = $1",
      [req.userId]
    )

    if (saveResult.rows.length === 0) {
      res.status(404).json({ error: "No save found" })
      return
    }

    const save = saveResult.rows[0]
    const saveId = save.id

    const [slots, upgrades, machines, patterns] = await Promise.all([
      query("SELECT * FROM slot_states WHERE save_id = $1 ORDER BY slot_index", [saveId]),
      query("SELECT * FROM upgrade_levels WHERE save_id = $1", [saveId]),
      query("SELECT * FROM machine_levels WHERE save_id = $1", [saveId]),
      query("SELECT * FROM pattern_progress WHERE save_id = $1", [saveId])
    ])

    res.json({
      money:          save.money,
      dc:             save.dc,
      prestigePoints: save.prestige_points,
      pendingPrestigePoints: save.pending_prestige_points ?? 0,
      level:          save.level,
      exp:            save.exp,
      unlockedSlots:  save.unlocked_slots,
      lastPlayed:     save.last_played,
      saveVersion:    save.save_version,
      slots:    slots.rows,
      upgrades: upgrades.rows,
      machines: machines.rows,
      patterns: patterns.rows
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to load save" })
  }
}

export async function upsertSave(req: AuthRequest, res: Response): Promise<void> {
  const payload = req.body as SavePayload
  const clientVersion = payload.saveVersion ?? 0

  try {
    // Try a version-gated update first
    const updateResult = await query<{ id: number; save_version: number }>(
      `UPDATE game_saves SET
         money           = $1,
         dc              = $2,
         prestige_points = $3,
         pending_prestige_points = $4,
         level           = $5,
         exp             = $6,
         unlocked_slots  = $7,
         last_played     = $8,
         save_version    = save_version + 1
       WHERE user_id = $9 AND save_version = $10
       RETURNING id, save_version`,
      [
        payload.money, payload.dc, payload.prestigePoints,
        payload.pendingPrestigePoints ?? 0,
        payload.level, payload.exp, payload.unlockedSlots,
        payload.lastPlayed, req.userId, clientVersion
      ]
    )

    let saveId: number
    let newVersion: number

    if (updateResult.rows.length > 0) {
      // Version matched — update succeeded
      saveId     = updateResult.rows[0].id
      newVersion = updateResult.rows[0].save_version
    } else {
      // No rows updated: either first-ever save, or version conflict
      const existsResult = await query<{ id: number; save_version: number }>(
        "SELECT id, save_version FROM game_saves WHERE user_id = $1",
        [req.userId]
      )

      if (existsResult.rows.length > 0) {
        // Row exists but version didn't match → conflict
        res.status(409).json({
          error: "Save conflict",
          serverVersion: existsResult.rows[0].save_version
        })
        return
      }

      // No save at all — create the first one
      const insertResult = await query<{ id: number; save_version: number }>(
        `INSERT INTO game_saves
           (user_id, money, dc, prestige_points, pending_prestige_points, level, exp, unlocked_slots, last_played, save_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,1)
         RETURNING id, save_version`,
        [
          req.userId, payload.money, payload.dc, payload.prestigePoints,
          payload.pendingPrestigePoints ?? 0,
          payload.level, payload.exp, payload.unlockedSlots, payload.lastPlayed
        ]
      )
      saveId     = insertResult.rows[0].id
      newVersion = insertResult.rows[0].save_version
    }

    // Upsert slots
    for (const slot of payload.slots) {
      await query(
        `INSERT INTO slot_states
           (save_id, slot_index, pattern_id, progress, unlocked, speed_multiplier, output_multiplier)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (save_id, slot_index) DO UPDATE SET
           pattern_id        = EXCLUDED.pattern_id,
           progress          = EXCLUDED.progress,
           unlocked          = EXCLUDED.unlocked,
           speed_multiplier  = EXCLUDED.speed_multiplier,
           output_multiplier = EXCLUDED.output_multiplier`,
        [saveId, slot.slotIndex, slot.patternId, slot.progress,
         slot.unlocked, slot.speedMultiplier, slot.outputMultiplier]
      )
    }

    // Upsert upgrades
    for (const upgrade of payload.upgrades) {
      await query(
        `INSERT INTO upgrade_levels (save_id, upgrade_id, level, upgrade_type)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (save_id, upgrade_id) DO UPDATE SET
           level = EXCLUDED.level`,
        [saveId, upgrade.upgradeId, upgrade.level, upgrade.upgradeType]
      )
    }

    // Upsert machines
    for (const machine of payload.machines) {
      await query(
        `INSERT INTO machine_levels (save_id, machine_id, level)
         VALUES ($1,$2,$3)
         ON CONFLICT (save_id, machine_id) DO UPDATE SET
           level = EXCLUDED.level`,
        [saveId, machine.machineId, machine.level]
      )
    }

    // Upsert patterns
    for (const pattern of payload.patterns) {
      await query(
        `INSERT INTO pattern_progress (save_id, pattern_id, level, exp, unlocked)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (save_id, pattern_id) DO UPDATE SET
           level   = EXCLUDED.level,
           exp     = EXCLUDED.exp,
           unlocked = EXCLUDED.unlocked`,
        [saveId, pattern.patternId, pattern.level, pattern.exp, pattern.unlocked]
      )
    }

    res.json({ saveVersion: newVersion })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to save game" })
  }
}

export async function deleteSave(req: AuthRequest, res: Response): Promise<void> {
  try {
    await query("DELETE FROM game_saves WHERE user_id = $1", [req.userId])
    res.json({ message: "Save deleted" })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Failed to delete save" })
  }
}