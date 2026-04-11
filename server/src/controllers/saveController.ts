import { Request, Response } from "express"
import { query } from "../db.js"
import { AuthRequest } from "../middleware/auth.js"
import { SavePayload } from "@shared/types"

export async function getSave(req: AuthRequest, res: Response): Promise<void> {
  try {
    const saveResult = await query<{
      id: number; money: number; dc: number
      prestige_points: number; level: number; exp: number
      unlocked_slots: number; last_played: number
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
      level:          save.level,
      exp:            save.exp,
      unlockedSlots:  save.unlocked_slots,
      lastPlayed:     save.last_played,
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

  try {
    // Update or insert game_saves
    const saveResult = await query<{ id: number }>(
      `INSERT INTO game_saves
         (user_id, money, dc, prestige_points, level, exp, unlocked_slots, last_played)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (user_id) DO UPDATE SET
         money          = EXCLUDED.money,
         dc             = EXCLUDED.dc,
         prestige_points = EXCLUDED.prestige_points,
         level          = EXCLUDED.level,
         exp            = EXCLUDED.exp,
         unlocked_slots = EXCLUDED.unlocked_slots,
         last_played    = EXCLUDED.last_played
       RETURNING id`,
      [
        req.userId,
        payload.money,
        payload.dc,
        payload.prestigePoints,
        payload.level,
        payload.exp,
        payload.unlockedSlots,
        payload.lastPlayed
      ]
    )

    const saveId = saveResult.rows[0].id

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

    res.json({ message: "Save successful" })
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