import { useGameStore }    from "@/stores/game"
import { usePatternStore } from "@/stores/pattern"
import { useSlotStore }    from "@/stores/slot"
import { useUpgradeStore } from "@/stores/upgrade"
import { useMachineStore } from "@/stores/machine"
import { api }             from "@/utils/api"
import type { SavePayload } from "../../shared/types"

function buildSavePayload(): SavePayload {
  const game     = useGameStore()
  const patterns = usePatternStore()
  const slots    = useSlotStore()
  const upgrades = useUpgradeStore()
  const machines = useMachineStore()

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
    level:          game.level,
    exp:            game.exp,
    unlockedSlots:  game.unlockedSlots,
    lastPlayed:     Date.now(),
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
    }))
  }
}

export async function saveGame(): Promise<void> {
  const token = localStorage.getItem("token")
  if (!token) return // not logged in, skip

  try {
    await api.put("/save", buildSavePayload())
  } catch (err) {
    console.error("Save failed:", err)
  }
}

export async function loadGame(): Promise<number | null> {
  const token = localStorage.getItem("token")
  if (!token) return null

  try {
    const data = await api.get<SavePayload & { lastPlayed: number }>("/save")

    const game = useGameStore()
    const patterns = usePatternStore()
    const slots = useSlotStore()
    const upgrades = useUpgradeStore()
    const machines = useMachineStore()

    // Patch game state
    game.$patch({
      money: data.money,
      dc: data.dc,
      prestigePoints: data.prestigePoints,
      level: data.level,
      exp: data.exp,
      unlockedSlots: data.unlockedSlots
    })

    // Patch slots
    const defaultSlots = slots.getDefaultSlots
    slots.slots = defaultSlots.map((defaultSlot, i) => {
      const saved = (data.slots as any[]).find((s: any) => s.slot_index === i)
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

    // Patch upgrades
    const normalLevels: Record<string, number>   = {}
    const dcLevels: Record<string, number>        = {}
    const prestigeLevels: Record<string, number>  = {}

    for (const u of data.upgrades as any[]) {
      if (u.upgrade_type === "normal")   normalLevels[u.upgrade_id]   = u.level
      if (u.upgrade_type === "dc")       dcLevels[u.upgrade_id]       = u.level
      if (u.upgrade_type === "prestige") prestigeLevels[u.upgrade_id] = u.level
    }

    upgrades.$patch({ levels: normalLevels, dcLevels, prestigeLevels })

    // Patch machines
    const machineLevels: Record<string, number> = {}
    for (const m of data.machines as any[]) {
      machineLevels[m.machine_id] = m.level
    }
    machines.$patch({ levels: machineLevels })

    // Patch patterns
    const patternData: Record<string, { level: number; exp: number }> = {}
    const unlockedPatterns: string[] = []

    for (const p of data.patterns as any[]) {
      patternData[p.pattern_id] = { level: p.level, exp: p.exp }
      if (p.unlocked) unlockedPatterns.push(p.pattern_id)
    }

    patterns.$patch({ patterns: patternData, unlockedPatterns })

    return data.lastPlayed
  } catch (err) {
    console.error("Load failed:", err)
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