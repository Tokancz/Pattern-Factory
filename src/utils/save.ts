import { useGameStore }    from "@/stores/game"
import { usePatternStore } from "@/stores/pattern"
import { useSlotStore }    from "@/stores/slot"
import { useUpgradeStore } from "@/stores/upgrade"
import { useMachineStore } from "@/stores/machine"
import { useGlyphStore }   from "@/stores/glyph"
import { useUserStore }    from "@/stores/user"
import { useAchievementStore } from "@/stores/achievement"
import { api, ApiError }   from "@/utils/api"
import { log }             from "@/utils/logger"
import type { SavePayload } from "../../shared/types"

// ─── Local save-file export/import ─────────────────────────────────────────
// Files are base64-wrapped so casual users can't eyeball-edit numbers, carry
// a salted checksum so a hand-tampered file is rejected on import, and are
// stamped with the owner's account id so a save can't be loaded into a
// *different* account (the "alt-account admin mode" exploit). The owner id is
// folded into the checksum, so editing it also breaks the hash.
// This is tamper-*evidence*, not real security — the salt ships in the bundle
// — but it stops casual cross-account transfers and value edits.
const SAVE_MAGIC = "PFSAVE2"
const SAVE_SALT  = "pattern-factory::do-not-edit::v1"

// cyrb53 — fast, well-distributed 53-bit string hash. Returns 16 hex chars.
function cyrb53(str: string, seed = 0): string {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const high = (h2 >>> 0).toString(16).padStart(8, "0")
  const low  = (h1 >>> 0).toString(16).padStart(8, "0")
  return high + low
}

// Unicode-safe base64 (avoids the deprecated escape/unescape pair).
function toBase64(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}
function fromBase64(s: string): string {
  const bin = atob(s)
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// Server returns rows in snake_case (raw from Postgres). We keep the on-the-
// wire shape narrow here so the patch path doesn't have to use `as any`.
interface SlotRow {
  slot_index:        number
  pattern_id:        string | null
  progress:          number
  unlocked:          boolean
  speed_multiplier:  number
  output_multiplier: number
}
interface UpgradeRow      { upgrade_id: string; level: number; upgrade_type: "normal" | "dc" | "prestige" }
interface MachineRow      { machine_id: string; level: number }
interface PatternRow      { pattern_id: string; level: number; exp: number; unlocked: boolean }
interface GlyphUpgradeRow { upgrade_id: string; level: number }

interface ServerSave extends Omit<SavePayload, "slots" | "upgrades" | "machines" | "patterns" | "glyphUpgrades"> {
  slots:         SlotRow[]
  upgrades:      UpgradeRow[]
  machines:      MachineRow[]
  patterns:      PatternRow[]
  glyphUpgrades: GlyphUpgradeRow[]
  achievements?: string[]
  lastPlayed:    number
}

// Tracks the save_version we last received from the server.
// Every successful save/load updates this so the next save can
// pass the correct version for the optimistic-lock check.
let saveVersion = 0

// Serialize saves — if one is already in flight, new callers await it.
// Prevents races where two concurrent PUTs fight for the same version.
let inFlight: Promise<void> | null = null

// Block any saves until the initial loadGame() has populated the stores.
// Without this, a saveGame() racing with the first load would PUT the
// default empty state and wipe the server save (see 409 path below).
let gameLoaded = false

export function isGameLoaded(): boolean {
  return gameLoaded
}

function buildSavePayload(): SavePayload {
  const game     = useGameStore()
  const patterns = usePatternStore()
  const slots    = useSlotStore()
  const upgrades = useUpgradeStore()
  const machines = useMachineStore()
  const glyph    = useGlyphStore()
  const achievements = useAchievementStore()

  const upgradePayload = [
    ...Object.entries(upgrades.levels).map(([upgradeId, level]) => ({
      upgradeId, level, upgradeType: "normal" as const
    })),
    ...Object.entries(upgrades.dcLevels).map(([upgradeId, level]) => ({
      upgradeId, level, upgradeType: "dc" as const
    })),
    ...Object.entries(upgrades.prestigeLevels).map(([upgradeId, level]) => ({
      upgradeId, level, upgradeType: "prestige" as const
    }))
  ]

  return {
    money:          game.money,
    dc:             game.dc,
    prestigePoints: game.prestigePoints,
    pendingPrestigePoints: game.pendingPrestigePoints,
    level:          game.level,
    exp:            game.exp,
    unlockedSlots:  game.unlockedSlots,
    lastPlayed:     Date.now(),
    saveVersion,
    slots: slots.slots.map(s => ({
      slotIndex:        s.id,
      patternId:        s.patternId,
      progress:         s.progress,
      unlocked:         s.unlocked,
      speedMultiplier:  s.speedMultiplier,
      outputMultiplier: s.outputMultiplier
    })),
    upgrades: upgradePayload,
    machines: Object.entries(machines.levels).map(([machineId, level]) => ({
      machineId, level
    })),
    patterns: Object.entries(patterns.patterns).map(([patternId, data]) => ({
      patternId,
      level:    data.level,
      exp:      data.exp,
      unlocked: patterns.unlockedPatterns.includes(patternId)
    })),

    // Reality Engine expansion state
    glyphs:            glyph.glyphs,
    pendingGlyphs:     glyph.pendingGlyphs,
    ascensionCount:    glyph.ascensionCount,
    glyphPatternCount: glyph.glyphPatternCount,
    endgameState:      glyph.endgameState,
    seenIntro:         glyph.seenIntro,
    glyphUpgrades:     Object.entries(glyph.boughtUpgrades).map(([upgradeId, level]) => ({
      upgradeId, level
    })),

    achievements: [...achievements.unlocked]
  }
}

export function saveGame(): Promise<void> {
  const token = localStorage.getItem("token")
  if (!token) return Promise.resolve()
  if (!gameLoaded) return Promise.resolve()

  // If a save is already running, wait for it and then start a fresh one so
  // the latest local state gets persisted. This serializes concurrent callers.
  if (inFlight) {
    return inFlight.then(() => saveGame())
  }

  inFlight = (async () => {
    try {
      const res = await api.put<{ saveVersion: number }>("/save", buildSavePayload())
      saveVersion = res.saveVersion
    } catch (err) {
      // On version conflict the other device wrote more recently — pull
      // server state instead of overwriting it. Last-write-wins by device.
      if (err instanceof ApiError && err.status === 409) {
        log.info("save conflict — pulling server state")
        await loadGame()
        return
      }
      const status = err instanceof ApiError ? err.status : "?"
      log.error(`save failed (status=${status})`, err)
    }
  })().finally(() => { inFlight = null })

  return inFlight
}

export async function loadGame(): Promise<number | null> {
  const token = localStorage.getItem("token")
  if (!token) return null

  try {
    const data = await api.get<ServerSave>("/save")

    // Sync our local version with what the server has
    saveVersion = data.saveVersion ?? 0

    const game     = useGameStore()
    const patterns = usePatternStore()
    const slots    = useSlotStore()
    const upgrades = useUpgradeStore()
    const machines = useMachineStore()
    const glyph    = useGlyphStore()
    const achievements = useAchievementStore()

    achievements.$patch({ unlocked: data.achievements ?? [] })

    // Patch game state
    game.$patch({
      money:                 data.money,
      dc:                    data.dc,
      prestigePoints:        data.prestigePoints,
      pendingPrestigePoints: data.pendingPrestigePoints ?? 0,
      level:                 data.level,
      exp:                   data.exp,
      unlockedSlots:         data.unlockedSlots
    })

    // Patch glyph state (Reality Engine expansion). Older saves predate
    // these columns — defaults keep them zeroed/false so legacy accounts
    // start the expansion fresh on first load.
    const glyphUpgradeMap: Record<string, number> = {}
    for (const u of data.glyphUpgrades ?? []) {
      glyphUpgradeMap[u.upgrade_id] = u.level
    }
    // Number() coerces BIGINT columns that node-postgres may still return
    // as strings on environments without the int8 type-parser registered
    // (e.g. an older deployment). Without this, `count += 1` becomes
    // string concatenation and the next save fails validation.
    glyph.$patch({
      glyphs:            Number(data.glyphs            ?? 0),
      pendingGlyphs:     Number(data.pendingGlyphs     ?? 0),
      ascensionCount:    Number(data.ascensionCount    ?? 0),
      glyphPatternCount: Number(data.glyphPatternCount ?? 0),
      endgameState:      data.endgameState      ?? null,
      seenIntro:         data.seenIntro         ?? false,
      boughtUpgrades:    glyphUpgradeMap
    })

    // Patch slots — keep the default array shape so any new slots we add
    // later are present even when missing from the server payload.
    slots.slots = slots.getDefaultSlots.map((defaultSlot, i) => {
      const saved = data.slots.find(s => s.slot_index === i)
      if (!saved) return defaultSlot
      return {
        ...defaultSlot,
        patternId:        saved.pattern_id,
        progress:         saved.progress,
        unlocked:         saved.unlocked,
        speedMultiplier:  saved.speed_multiplier,
        outputMultiplier: saved.output_multiplier
      }
    })

    // Patch upgrades — split server rows by upgrade_type into the three
    // sibling level maps the upgrade store keeps separately.
    const normalLevels:   Record<string, number> = {}
    const dcLevels:       Record<string, number> = {}
    const prestigeLevels: Record<string, number> = {}

    for (const u of data.upgrades) {
      if      (u.upgrade_type === "normal")   normalLevels[u.upgrade_id]   = u.level
      else if (u.upgrade_type === "dc")       dcLevels[u.upgrade_id]       = u.level
      else if (u.upgrade_type === "prestige") prestigeLevels[u.upgrade_id] = u.level
    }

    upgrades.$patch({ levels: normalLevels, dcLevels, prestigeLevels })

    // Patch machines
    const machineLevels: Record<string, number> = {}
    for (const m of data.machines) machineLevels[m.machine_id] = m.level
    machines.$patch({ levels: machineLevels })

    // Patch patterns
    const patternData: Record<string, { level: number; exp: number }> = {}
    const unlockedPatterns: string[] = []
    for (const p of data.patterns) {
      patternData[p.pattern_id] = { level: p.level, exp: p.exp }
      if (p.unlocked) unlockedPatterns.push(p.pattern_id)
    }
    patterns.$patch({ patterns: patternData, unlockedPatterns })

    gameLoaded = true
    log.debug("save loaded", { saveVersion, lastPlayed: data.lastPlayed })
    return data.lastPlayed
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      // Brand-new account with no save yet — local defaults are the truth.
      // Flip the flag so the first save can create the row.
      gameLoaded = true
      return null
    }
    const status = err instanceof ApiError ? err.status : "?"
    log.error(`load failed (status=${status})`, err)
    return null
  }
}

export function startAutoSave(): void {
  setInterval(() => {
    saveGame()
  }, 5000)
}

export function resetSave(): void {
  localStorage.removeItem("token")
  location.reload()
}

// Apply a camelCase SavePayload (as produced by buildSavePayload / a save
// file) onto the stores. Mirrors loadGame()'s snake_case patch path.
function applyPayload(data: SavePayload): void {
  const game     = useGameStore()
  const patterns = usePatternStore()
  const slots    = useSlotStore()
  const upgrades = useUpgradeStore()
  const machines = useMachineStore()
  const glyph    = useGlyphStore()
  const achievements = useAchievementStore()

  achievements.$patch({ unlocked: data.achievements ?? [] })

  game.$patch({
    money:                 data.money,
    dc:                    data.dc,
    prestigePoints:        data.prestigePoints,
    pendingPrestigePoints: data.pendingPrestigePoints ?? 0,
    level:                 data.level,
    exp:                   data.exp,
    unlockedSlots:         data.unlockedSlots
  })

  const glyphUpgradeMap: Record<string, number> = {}
  for (const u of data.glyphUpgrades ?? []) glyphUpgradeMap[u.upgradeId] = u.level
  glyph.$patch({
    glyphs:            Number(data.glyphs            ?? 0),
    pendingGlyphs:     Number(data.pendingGlyphs     ?? 0),
    ascensionCount:    Number(data.ascensionCount    ?? 0),
    glyphPatternCount: Number(data.glyphPatternCount ?? 0),
    endgameState:      data.endgameState      ?? null,
    seenIntro:         data.seenIntro         ?? false,
    boughtUpgrades:    glyphUpgradeMap
  })

  slots.slots = slots.getDefaultSlots.map((defaultSlot, i) => {
    const saved = data.slots.find(s => s.slotIndex === i)
    if (!saved) return defaultSlot
    return {
      ...defaultSlot,
      patternId:        saved.patternId,
      progress:         saved.progress,
      unlocked:         saved.unlocked,
      speedMultiplier:  saved.speedMultiplier,
      outputMultiplier: saved.outputMultiplier
    }
  })

  const normalLevels:   Record<string, number> = {}
  const dcLevels:       Record<string, number> = {}
  const prestigeLevels: Record<string, number> = {}
  for (const u of data.upgrades) {
    if      (u.upgradeType === "normal")   normalLevels[u.upgradeId]   = u.level
    else if (u.upgradeType === "dc")       dcLevels[u.upgradeId]       = u.level
    else if (u.upgradeType === "prestige") prestigeLevels[u.upgradeId] = u.level
  }
  upgrades.$patch({ levels: normalLevels, dcLevels, prestigeLevels })

  const machineLevels: Record<string, number> = {}
  for (const m of data.machines) machineLevels[m.machineId] = m.level
  machines.$patch({ levels: machineLevels })

  const patternData: Record<string, { level: number; exp: number }> = {}
  const unlockedPatterns: string[] = []
  for (const p of data.patterns) {
    patternData[p.patternId] = { level: p.level, exp: p.exp }
    if (p.unlocked) unlockedPatterns.push(p.patternId)
  }
  patterns.$patch({ patterns: patternData, unlockedPatterns })
}

// Folds the save body + owner id + salt into one checksum input, so editing
// either the data or the stamped owner id invalidates the file.
function saveChecksum(data: SavePayload, ownerId: number | null): string {
  return cyrb53(`${JSON.stringify(data)}|${ownerId}${SAVE_SALT}`)
}

// Serialize the current game into a portable, checksum-protected save string
// stamped with the logged-in account's id.
export function exportSave(): string {
  const user = useUserStore()
  const ownerId = user.user?.id ?? null
  const data = buildSavePayload()
  const hash = saveChecksum(data, ownerId)
  return toBase64(JSON.stringify({ magic: SAVE_MAGIC, ownerId, hash, data }))
}

export interface ImportResult {
  ok: boolean
  error?: string
}

// Validate + apply a save string produced by exportSave(). Rejects files that
// are corrupted/hand-edited (checksum mismatch) or that belong to a different
// account (owner-id mismatch). On success the imported state is pushed to the
// server so it survives a refresh.
export async function importSave(text: string): Promise<ImportResult> {
  let envelope: { magic?: string; hash?: string; ownerId?: number | null; data?: SavePayload }
  try {
    envelope = JSON.parse(fromBase64(text.trim()))
  } catch {
    return { ok: false, error: "This file isn't a valid Pattern Factory save." }
  }

  if (!envelope || envelope.magic !== SAVE_MAGIC || typeof envelope.hash !== "string" || !envelope.data) {
    return { ok: false, error: "Unrecognized save format." }
  }

  const ownerId = envelope.ownerId ?? null
  if (saveChecksum(envelope.data, ownerId) !== envelope.hash) {
    return { ok: false, error: "Save file is corrupted or has been modified." }
  }

  // Account binding: only the account that exported the file may import it.
  const currentId = useUserStore().user?.id ?? null
  if (ownerId === null || currentId === null || ownerId !== currentId) {
    return { ok: false, error: "This save belongs to a different account." }
  }

  try {
    applyPayload(envelope.data)
    await saveGame()
    return { ok: true }
  } catch (err) {
    log.error("import failed while applying save", err)
    return { ok: false, error: "Couldn't apply the save — it may be from an incompatible version." }
  }
}
