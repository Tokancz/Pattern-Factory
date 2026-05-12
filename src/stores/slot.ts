import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { usePatternStore } from "./pattern"
import { useUpgradeStore } from "./upgrade"
import { useGlyphStore } from "./glyph"
import { PATTERNS } from "@/data/patterns"
import { saveGame } from "@/utils/save"
import { useMachineStore } from "./machine"
import { useSynergyStore } from "./synergy"
import { playSound } from "@/utils/sound"

interface Slot {
  id: number
  patternId: string | null
  progress: number
  unlocked: boolean
  speedMultiplier: number
  outputMultiplier: number
}

// Slot 4 is the 5th thread, gated behind the Slot V Glyph upgrade. It's
// always present in the underlying state (so saves can carry its data
// across runs) but hidden from the UI until Slot V is owned.
const DEFAULT_SLOTS: Slot[] = [
  { id: 0, patternId: "square", progress: 0, unlocked: true, speedMultiplier: 1, outputMultiplier: 1 },
  { id: 1, patternId: null, progress: 0, unlocked: false, speedMultiplier: 1, outputMultiplier: 1 },
  { id: 2, patternId: null, progress: 0, unlocked: false, speedMultiplier: 1, outputMultiplier: 1 },
  { id: 3, patternId: null, progress: 0, unlocked: false, speedMultiplier: 1, outputMultiplier: 1 },
  { id: 4, patternId: null, progress: 0, unlocked: false, speedMultiplier: 1, outputMultiplier: 1 }
]

export const useSlotStore = defineStore("slots", {
  state: () => ({
    slots: [...DEFAULT_SLOTS],
    baseSpeed: 1,
    selectedSlotId: null as number | null
  }),

  getters: {
    getDefaultSlots: () => [...DEFAULT_SLOTS],

    // What the UI should iterate. Hides slot 4 entirely until Slot V is
    // owned — no greyed-out placeholder, no silhouette. The player should
    // not know it exists before purchase.
    visibleSlots: (state): Slot[] => {
      const glyph = useGlyphStore()
      return glyph.hasUpgrade("slotV") ? state.slots : state.slots.slice(0, 4)
    },

    // Hard ceiling on unlockable threads, used by the slotUnlock module.
    maxSlots: (): number => {
      const glyph = useGlyphStore()
      return glyph.hasUpgrade("slotV") ? 5 : 4
    }
  },

  actions: {
    getSlotSpeed(slot: Slot) {
      const machines = useMachineStore()
      const upgrades = useUpgradeStore()

      // DC speed multiplier is per-pattern
      const dcSpeedBonus = slot.patternId
        ? upgrades.getDcSpeedMultiplier(slot.patternId)
        : 1

      const synergy = useSynergyStore()
      const synergySpeedBonus = slot.patternId
        ? synergy.getSpeedMultiplier(slot.patternId)
        : 1

      let speed =
        this.baseSpeed *
        slot.speedMultiplier *
        upgrades.getSpeedMultiplier *
        machines.getMultiplier("slotBoost") *
        dcSpeedBonus *
        synergySpeedBonus

      // Glyph slots ignore the targeted boost — overclocking a Γ thread
      // would trivialise endgame pacing, since pending Γ is the dominant
      // ascension currency. Global Overclock (slotBoost) still applies.
      if (slot.id === this.selectedSlotId && slot.patternId !== "glyph") {
        speed *= machines.getMultiplier("targetedBoost")
      }

      return speed
    },

    tick(delta: number) {
      const game = useGameStore()
      const patterns = usePatternStore()

      if (!delta || isNaN(delta) || !isFinite(delta)) return
      // 24h ceiling — caller is responsible for the offline-cap upgrade.
      const safeDelta = Math.min(delta, 86400)

      this.slots.forEach(slot => {
        if (!slot.unlocked || !slot.patternId) return

        const maxProgress = PATTERNS[slot.patternId as keyof typeof PATTERNS]?.baseProgress ?? 100
        const speed = this.getSlotSpeed(slot)
        const gain = safeDelta * speed

        if (isNaN(gain) || !isFinite(gain)) return

        slot.progress += gain

        if (slot.progress >= maxProgress) {
          this.completeSlot(slot, game, patterns)
        }

        slot.progress = Math.max(0, Math.min(slot.progress, maxProgress))
      })
    },

    clickSlot(slotId: number) {
      const slot = this.slots.find(s => s.id === slotId)
      if (!slot || !slot.patternId) return
      // Cross is auto-only by default — Echo of the Cross unlocks manual
      // clicks (with a cooldown enforced in Slot.vue, since this store
      // doesn't model timing per-thread).
      if (slot.patternId === "cross") {
        const glyph = useGlyphStore()
        if (!glyph.hasUpgrade("echoOfTheCross")) return
      }
      // Glyph pattern is fully auto-only — slow by design, no manual
      // acceleration path. Mirrors the Cross block but with no escape
      // upgrade (intentional: clicking would trivialise endgame Γ gain).
      if (slot.patternId === "glyph") return

      const upgrades = useUpgradeStore()
      slot.progress += upgrades.getClickPower
    },

    completeSlot(slot: Slot, game: ReturnType<typeof useGameStore>, patterns: ReturnType<typeof usePatternStore>) {
      const upgrades = useUpgradeStore()
      const machines = useMachineStore()

      // DC output multiplier is per-pattern
      const dcOutputBonus = slot.patternId
        ? upgrades.getDcOutputMultiplier(slot.patternId)
        : 1

      const synergy = useSynergyStore()
      const synergyOutputBonus = slot.patternId
        ? synergy.getOutputMultiplier(slot.patternId)
        : 1

      let value = patterns.getPatternValue(slot.patternId!) * slot.outputMultiplier
      value *= machines.getMultiplier("outputBoost")
      value *= upgrades.getPrestigeOutputBonus
      value *= dcOutputBonus
      value *= synergyOutputBonus

      if (isNaN(value) || !isFinite(value)) return

      const type = PATTERNS[slot.patternId! as keyof typeof PATTERNS].type

      if (type === "money") game.addMoney(value)
      else if (type === "exp") game.addExp(value)
      else if (type === "dc") game.addDC(value)
      else if (type === "prestige") {
        const prestigeGain = Math.max(1, Math.floor(Math.log2(value + 2)))
        game.addPendingPrestigePoints(prestigeGain)
      }
      else if (type === "glyph") {
        // Each completion banks 1 pending Γ at base. Glyph Genesis (Tier 3)
        // doubles the rate. baseProgress on the glyph pattern is tuned so
        // that one completion takes ~30 minutes at base speed; speed
        // multipliers naturally accelerate it as the player progresses.
        const glyph = useGlyphStore()
        const rate = glyph.hasUpgrade("glyphGenesis") ? 2 : 1
        glyph.addPendingGlyphs(rate)
        // Lifetime counter — drives the Architect's Choice endgame.
        glyph.glyphPatternCount += 1
      }

      const expMultiplier = upgrades.getExpMultiplier * machines.getMultiplier("expMachine")
      const expGain = 1 * expMultiplier

      if (!isNaN(expGain) && isFinite(expGain)) {
        patterns.addExp(slot.patternId!, expGain)
      }

      slot.progress = 0
      playSound("pop")
    },

    assignPattern(slotId: number, patternId: string) {
      const slot = this.slots.find(s => s.id === slotId)
      if (!slot) return
      slot.patternId = patternId
      slot.progress = 0
      saveGame()
    },

    unlockSlot() {
      // Only consider slots within the player's current cap (4 by default,
      // 5 when Slot V is owned). Without this, the slotUnlock module would
      // happily pop slot 4 for players who don't own Slot V yet.
      const cap = this.maxSlots
      const slot = this.slots.find(s => !s.unlocked && s.id < cap)
      if (!slot) return
      slot.unlocked = true
      saveGame()
    },

    selectSlot(id: number) {
      const machines = useMachineStore()
      if (machines.getLevel("targetedBoost") < 1) return
      // Block selection on Γ threads — the boost is no-op there and
      // letting it appear selected would be misleading UI.
      const target = this.slots.find(s => s.id === id)
      if (target?.patternId === "glyph") return
      this.selectedSlotId = id
    },

    cleanSlot(slot: Slot) {
      return {
        ...slot,
        progress: typeof slot.progress === "number" && !isNaN(slot.progress) ? slot.progress : 0,
        speedMultiplier: typeof slot.speedMultiplier === "number" ? slot.speedMultiplier : 1,
        outputMultiplier: typeof slot.outputMultiplier === "number" ? slot.outputMultiplier : 1
      }
    },

    reset() {
      this.slots = this.getDefaultSlots.map(s => ({ ...s }))
      this.selectedSlotId = null

      // Slot V grants a +1 starting unlocked thread post-prestige so the
      // 5th thread doesn't feel like dead UI on a fresh run.
      const glyph = useGlyphStore()
      if (glyph.hasUpgrade("slotV") && this.slots[1]) {
        this.slots[1].unlocked = true
      }
    }
  }
})