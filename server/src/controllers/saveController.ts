import { Request, Response } from "express"
import { query } from "../db.js"
import { log }   from "../utils/logger.js"
import { AuthRequest } from "../middleware/auth.js"

interface SlotStatePayload {
  slotIndex:        number
  patternId:        string | null
  progress:         number
  unlocked:         boolean
  speedMultiplier:  number
  outputMultiplier: number
}
interface UpgradeLevelPayload {
  upgradeId:   string
  level:       number
  upgradeType: "normal" | "dc" | "prestige"
}

interface MachineLevelPayload {
  machineId: string
  level:     number
}

interface PatternProgressPayload {
  patternId: string
  level:     number
  exp:       number
  unlocked:  boolean
}

interface GlyphUpgradeLevelPayload {
  upgradeId: string
  level:     number
}

interface SavePayload {
  money:                 number
  dc:                    number
  prestigePoints:        number
  pendingPrestigePoints: number
  level:                 number
  exp:                   number
  unlockedSlots:         number
  lastPlayed:            number
  saveVersion:           number
  slots:                 SlotStatePayload[]
  upgrades:              UpgradeLevelPayload[]
  machines:              MachineLevelPayload[]
  patterns:              PatternProgressPayload[]

  // Reality Engine expansion (optional on the wire — older clients
  // without these fields are tolerated; the server defaults them).
  glyphs?:            number
  pendingGlyphs?:     number
  ascensionCount?:    number
  glyphPatternCount?: number
  endgameState?:      "stabilized" | null
  seenIntro?:         boolean
  glyphUpgrades?:     GlyphUpgradeLevelPayload[]
}

// The client is authoritative for its own progression (idle game, no
// adversarial multiplayer), but we still defend the DB from NaN/Infinity
// and negatives — these would corrupt arithmetic on the server side and
// break leaderboard ordering. The check is intentionally cheap.
function finiteNonNeg(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
}

function validateSavePayload(p: SavePayload): string | null {
  const numericFields: Array<[string, unknown]> = [
    ["money",                 p.money],
    ["dc",                    p.dc],
    ["prestigePoints",        p.prestigePoints],
    ["pendingPrestigePoints", p.pendingPrestigePoints],
    ["level",                 p.level],
    ["exp",                   p.exp],
    ["unlockedSlots",         p.unlockedSlots],
    ["lastPlayed",            p.lastPlayed],
    ["saveVersion",           p.saveVersion],
    ["glyphs",                p.glyphs            ?? 0],
    ["pendingGlyphs",         p.pendingGlyphs     ?? 0],
    ["ascensionCount",        p.ascensionCount    ?? 0],
    ["glyphPatternCount",     p.glyphPatternCount ?? 0]
  ]
  for (const [name, value] of numericFields) {
    if (!finiteNonNeg(value)) return `${name} must be a finite, non-negative number`
  }
  if (!Array.isArray(p.slots) || p.slots.length > 5)            return "slots must be an array of ≤5"
  if (!Array.isArray(p.upgrades) || p.upgrades.length > 200)    return "upgrades array too large"
  if (!Array.isArray(p.machines) || p.machines.length > 50)     return "machines array too large"
  if (!Array.isArray(p.patterns) || p.patterns.length > 10)     return "patterns array too large"
  if (p.glyphUpgrades && p.glyphUpgrades.length > 100)          return "glyphUpgrades array too large"
  return null
}

export async function getSave(req: AuthRequest, res: Response): Promise<void> {
  try {
    const saveResult = await query<{
      id: number; money: number; dc: number
      prestige_points: number; pending_prestige_points: number
      level: number; exp: number
      unlocked_slots: number; last_played: number; save_version: number
      glyphs: number; pending_glyphs: number
      ascension_count: number; glyph_pattern_count: number
      endgame_state: string | null
      seen_intro: boolean
    }>(
      "SELECT * FROM game_saves WHERE user_id = $1",
      [req.userId]
    )

    if (saveResult.rows.length === 0) {
      res.status(404).json({ error: "No save found" })
      return
    }

    const save   = saveResult.rows[0]!
    const saveId = save.id

    const [slots, upgrades, machines, patterns, glyphUpgrades] = await Promise.all([
      query("SELECT * FROM slot_states WHERE save_id = $1 ORDER BY slot_index", [saveId]),
      query("SELECT * FROM upgrade_levels WHERE save_id = $1", [saveId]),
      query("SELECT * FROM machine_levels WHERE save_id = $1", [saveId]),
      query("SELECT * FROM pattern_progress WHERE save_id = $1", [saveId]),
      query("SELECT * FROM glyph_upgrade_levels WHERE save_id = $1", [saveId])
    ])

    res.json({
      money:                 save.money,
      dc:                    save.dc,
      prestigePoints:        save.prestige_points,
      pendingPrestigePoints: save.pending_prestige_points ?? 0,
      level:                 save.level,
      exp:                   save.exp,
      unlockedSlots:         save.unlocked_slots,
      lastPlayed:            save.last_played,
      saveVersion:           save.save_version,
      slots:    slots.rows,
      upgrades: upgrades.rows,
      machines: machines.rows,
      patterns: patterns.rows,

      // Reality Engine expansion fields. Defaults make legacy rows
      // (pre-migration data) safe to round-trip back to the client.
      glyphs:            save.glyphs ?? 0,
      pendingGlyphs:     save.pending_glyphs ?? 0,
      ascensionCount:    save.ascension_count ?? 0,
      glyphPatternCount: save.glyph_pattern_count ?? 0,
      endgameState:      save.endgame_state ?? null,
      seenIntro:         save.seen_intro ?? false,
      glyphUpgrades:     glyphUpgrades.rows
    })
  } catch (err) {
    log.error("save.get", "load failed", { err, userId: req.userId })
    res.status(500).json({ error: "Failed to load save" })
  }
}

export async function upsertSave(req: AuthRequest, res: Response): Promise<void> {
  const payload = req.body as SavePayload
  const invalid = validateSavePayload(payload)
  if (invalid) {
    res.status(400).json({ error: invalid })
    return
  }

  const clientVersion = payload.saveVersion ?? 0

  // Reality Engine fields — default everything so older clients that
  // don't send these don't blow away existing server data with NULLs.
  const glyphs            = payload.glyphs            ?? 0
  const pendingGlyphs     = payload.pendingGlyphs     ?? 0
  const ascensionCount    = payload.ascensionCount    ?? 0
  const glyphPatternCount = payload.glyphPatternCount ?? 0
  const endgameState      = payload.endgameState      ?? null
  const seenIntro         = payload.seenIntro         ?? false

  try {
    // Try a version-gated update first
    const updateResult = await query<{ id: number; save_version: number }>(
      `UPDATE game_saves SET
         money                   = $1,
         dc                      = $2,
         prestige_points         = $3,
         pending_prestige_points = $4,
         level                   = $5,
         exp                     = $6,
         unlocked_slots          = $7,
         last_played             = $8,
         glyphs                  = $9,
         pending_glyphs          = $10,
         ascension_count         = $11,
         glyph_pattern_count     = $12,
         endgame_state           = $13,
         seen_intro              = $14,
         save_version            = save_version + 1
       WHERE user_id = $15 AND save_version = $16
       RETURNING id, save_version`,
      [
        payload.money, payload.dc, payload.prestigePoints,
        payload.pendingPrestigePoints ?? 0,
        payload.level, payload.exp, payload.unlockedSlots,
        payload.lastPlayed,
        glyphs, pendingGlyphs, ascensionCount, glyphPatternCount,
        endgameState, seenIntro,
        req.userId, clientVersion
      ]
    )

    let saveId:     number
    let newVersion: number

    if (updateResult.rows.length > 0) {
      saveId     = updateResult.rows[0]!.id
      newVersion = updateResult.rows[0]!.save_version
    } else {
      // No rows updated: either first-ever save, or version conflict
      const existsResult = await query<{ id: number; save_version: number }>(
        "SELECT id, save_version FROM game_saves WHERE user_id = $1",
        [req.userId]
      )

      if (existsResult.rows.length > 0) {
        // Save exists but version didn't match → conflict. Worth logging:
        // a high rate of these flags either tab-juggling, clock skew, or
        // an autosave bug.
        log.info("save.upsert", "version conflict", {
          userId:        req.userId,
          clientVersion,
          serverVersion: existsResult.rows[0]!.save_version
        })
        res.status(409).json({
          error:         "Save conflict",
          serverVersion: existsResult.rows[0]!.save_version
        })
        return
      }

      // No save at all — create the first one
      const insertResult = await query<{ id: number; save_version: number }>(
        `INSERT INTO game_saves
           (user_id, money, dc, prestige_points, pending_prestige_points,
            level, exp, unlocked_slots, last_played,
            glyphs, pending_glyphs, ascension_count, glyph_pattern_count,
            endgame_state, seen_intro,
            save_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,1)
         RETURNING id, save_version`,
        [
          req.userId, payload.money, payload.dc, payload.prestigePoints,
          payload.pendingPrestigePoints ?? 0,
          payload.level, payload.exp, payload.unlockedSlots, payload.lastPlayed,
          glyphs, pendingGlyphs, ascensionCount, glyphPatternCount,
          endgameState, seenIntro
        ]
      )
      saveId     = insertResult.rows[0]!.id
      newVersion = insertResult.rows[0]!.save_version
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
           level    = EXCLUDED.level,
           exp      = EXCLUDED.exp,
           unlocked = EXCLUDED.unlocked`,
        [saveId, pattern.patternId, pattern.level, pattern.exp, pattern.unlocked]
      )
    }

    // Upsert glyph upgrades — only when the client actually sent them.
    // (Older clients without the expansion will just leave server data
    // alone instead of wiping it.)
    if (payload.glyphUpgrades) {
      for (const upgrade of payload.glyphUpgrades) {
        await query(
          `INSERT INTO glyph_upgrade_levels (save_id, upgrade_id, level)
           VALUES ($1,$2,$3)
           ON CONFLICT (save_id, upgrade_id) DO UPDATE SET
             level = EXCLUDED.level`,
          [saveId, upgrade.upgradeId, upgrade.level]
        )
      }
    }

    res.json({ saveVersion: newVersion })
  } catch (err) {
    log.error("save.upsert", "save failed", { err, userId: req.userId })
    res.status(500).json({ error: "Failed to save game" })
  }
}

export async function deleteSave(req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await query("DELETE FROM game_saves WHERE user_id = $1", [req.userId])
    log.info("save.delete", "save deleted", { userId: req.userId, rowsDeleted: result.rowCount })
    res.json({ message: "Save deleted" })
  } catch (err) {
    log.error("save.delete", "delete failed", { err, userId: req.userId })
    res.status(500).json({ error: "Failed to delete save" })
  }
}
