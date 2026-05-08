import { useGameStore }    from "@/stores/game"
import { usePatternStore } from "@/stores/pattern"
import { useSlotStore }    from "@/stores/slot"
import { useUpgradeStore } from "@/stores/upgrade"
import { useMachineStore } from "@/stores/machine"
import { useGlyphStore }   from "@/stores/glyph"
import { api, ApiError }   from "@/utils/api"
import { log }             from "@/utils/logger"
import type { SavePayload } from "../../shared/types"

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
    }))
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
    glyph.$patch({
      glyphs:            data.glyphs            ?? 0,
      pendingGlyphs:     data.pendingGlyphs     ?? 0,
      ascensionCount:    data.ascensionCount    ?? 0,
      glyphPatternCount: data.glyphPatternCount ?? 0,
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
