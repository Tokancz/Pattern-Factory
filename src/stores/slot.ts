import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { usePatternStore } from "./pattern"
import { useUpgradeStore } from "./upgrade"
import { PATTERNS } from "@/data/patterns"
import { saveGame } from "@/utils/save"
import { useMachineStore } from "./machine"

interface Slot {
  id: number
  patternId: string | null
  progress: number
  unlocked: boolean
  speedMultiplier: number
  outputMultiplier: number
}

const DEFAULT_SLOTS: Slot[] = [
  { id: 0, patternId: "square", progress: 0, unlocked: true, speedMultiplier: 1, outputMultiplier: 1 },
  { id: 1, patternId: null, progress: 0, unlocked: false, speedMultiplier: 1, outputMultiplier: 1 },
  { id: 2, patternId: null, progress: 0, unlocked: false, speedMultiplier: 1, outputMultiplier: 1 },
  { id: 3, patternId: null, progress: 0, unlocked: false, speedMultiplier: 1, outputMultiplier: 1 }
]

// Hard cap on the combined speed multiplier per slot.
// Without this, stacking Overclock machines becomes near-instant.
const MAX_SLOT_SPEED = 10

export const useSlotStore = defineStore("slots", {
  state: () => ({
    slots: [...DEFAULT_SLOTS],
    baseSpeed: 1,
    selectedSlotId: null as number | null
  }),

  getters: {
    getDefaultSlots: () => [...DEFAULT_SLOTS]
  },

  actions: {
    getSlotSpeed(slot: Slot) {
      const machines = useMachineStore()
      const upgrades = useUpgradeStore()

      let speed =
        this.baseSpeed *
        slot.speedMultiplier *
        upgrades.getSpeedMultiplier *
        machines.getMultiplier("slotBoost")

      if (slot.id === this.selectedSlotId) {
        speed *= machines.getMultiplier("targetedBoost")
      }

      // Cap total speed so late-game stacking doesn't break the game
      return Math.min(speed, MAX_SLOT_SPEED)
    },

    tick(delta: number) {
      const game = useGameStore()
      const patterns = usePatternStore()

      if (!delta || isNaN(delta) || !isFinite(delta)) return
      const safeDelta = Math.min(delta, 3600)

      this.slots.forEach(slot => {
        if (!slot.unlocked || !slot.patternId) return

        const maxProgress = PATTERNS[slot.patternId]?.baseProgress ?? 100
        const speed = this.getSlotSpeed(slot)
        const gain = safeDelta * speed

        if (isNaN(gain) || !isFinite(gain)) return

        slot.progress += gain

        if (slot.progress >= maxProgress) {
          this.completeSlot(slot, game, patterns)
          // completeSlot sets progress = 0, but guard any overshoot
          slot.progress = 0
        }

        // Safety clamp — keeps progress in [0, maxProgress] at all times
        // so generateBar never receives an out-of-range value
        slot.progress = Math.max(0, Math.min(slot.progress, maxProgress))
      })
    },

    clickSlot(slotId: number) {
      const slot = this.slots.find(s => s.id === slotId)
      if (!slot || !slot.patternId) return
      if (slot.patternId === "cross") return

      const upgrades = useUpgradeStore()
      const maxProgress = PATTERNS[slot.patternId]?.baseProgress ?? 100
      // Clamp click so it doesn't push progress above max mid-tick
      slot.progress = Math.min(slot.progress + upgrades.getClickPower, maxProgress)
    },

    completeSlot(slot: Slot, game: ReturnType<typeof useGameStore>, patterns: ReturnType<typeof usePatternStore>) {
      const upgrades = useUpgradeStore()
      const machines = useMachineStore()

      // getPatternValue already includes:
      //   base × level scaling × sellMultiplier × prestigeOutputBonus
      // We then additionally apply per-slot outputMultiplier and outputBoost machine.
      // Do NOT apply upgrades.getPrestigeOutputBonus again here — already in getPatternValue.
      let value = patterns.getPatternValue(slot.patternId!) * slot.outputMultiplier
      value *= machines.getMultiplier("outputBoost")

      if (isNaN(value) || !isFinite(value)) return

      const type = PATTERNS[slot.patternId!].type

      if (type === "money") game.addMoney(value)
      else if (type === "exp") game.addExp(value)
      else if (type === "dc") game.addDC(value)
      else if (type === "prestige") {
        const prestigeGain = Math.max(1, Math.floor(Math.log2(value + 2)))
        game.addPrestigePoints(prestigeGain)
      }

      // FIX: Flat 1 EXP per completion × upgrade multipliers only.
      // Old code: `value * 0.3` — because value grows exponentially with
      // level and prestige bonuses, EXP scaled out of control and patterns
      // hit high levels within minutes. Now leveling requires real completions.
      const expMultiplier = upgrades.getExpMultiplier * machines.getMultiplier("expMachine")
      const expGain = 1 * expMultiplier

      if (!isNaN(expGain) && isFinite(expGain)) {
        patterns.addExp(slot.patternId!, expGain)
      }

      slot.progress = 0
    },

    assignPattern(slotId: number, patternId: string) {
      const slot = this.slots.find(s => s.id === slotId)
      if (!slot) return
      slot.patternId = patternId
      slot.progress = 0
      saveGame()
    },

    unlockSlot() {
      const slot = this.slots.find(s => !s.unlocked)
      if (!slot) return
      slot.unlocked = true
      saveGame()
    },

    selectSlot(id: number) {
      const machines = useMachineStore()
      if (machines.getLevel("targetedBoost") < 1) return
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
    }
  }
})