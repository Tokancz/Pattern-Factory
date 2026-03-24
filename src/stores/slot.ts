import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { usePatternStore } from "./pattern"
import { useUpgradeStore } from "./upgrade"
import { PATTERNS } from "@/data/patterns"
import { saveGame } from "@/utils/save"

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

export const useSlotStore = defineStore("slots", {
  state: () => ({
    slots: [...DEFAULT_SLOTS],
    baseSpeed: 1
  }),
  
  getters: {
    getDefaultSlots: () => [...DEFAULT_SLOTS], // <-- export default slots
  },

  actions: {
    tick(delta: number) {
      const game = useGameStore()
      const patterns = usePatternStore()

      // 🔥 guard delta
      if (!delta || isNaN(delta)) return

      this.slots.forEach(slot => {
        if (!slot.unlocked || !slot.patternId) return

        const maxProgress = PATTERNS[slot.patternId].baseProgress || 100

        const upgrades = useUpgradeStore()
        slot.progress += delta * upgrades.getSpeedMultiplier
        slot.progress = typeof slot.progress === "number" && !isNaN(slot.progress) ? slot.progress : 0

        if (slot.progress >= maxProgress) {
          this.completeSlot(slot, game, patterns)
        }
      })
    },

    clickSlot(slotId: number) {
      const slot = this.slots.find(s => s.id === slotId)
      if (!slot || !slot.patternId) return

      if (slot.patternId === "cross") return // 👈 important

      const upgrades = useUpgradeStore()
      const clickPower = upgrades.getClickPower

      slot.progress += 5 * clickPower
    },

    completeSlot(slot: Slot, game: any, patterns: any) {
      const upgrades = useUpgradeStore()

      const value = patterns.getPatternValue(slot.patternId) * slot.outputMultiplier
      const type = PATTERNS[slot.patternId].type
      
      if (type === "money") game.addMoney(value)
      if (type === "exp") game.addExp(value)
      if (type === "dc") game.addDC(value)
      if (type === "prestige") {
        let prestigeGain = Math.log10(value + 1) // base scaling (IMPORTANT)

        const boost = 1 + (upgrades.levels.crossBoost || 0) * 0.3// upgrade scaling
        prestigeGain *= boost

        // minimum gain
        prestigeGain = Math.max(1, Math.floor(prestigeGain))

        game.addPrestigePoints(prestigeGain)
      }

      const expGain = value * 0.4 * upgrades.getExpMultiplier // base 20% of output as EXP, scaled by upgrades

      patterns.addExp(slot.patternId, expGain)

      slot.progress = 0
    },

    assignPattern(slotId: number, patternId: string) {
      const slot = this.slots.find(s => s.id === slotId)
      if (!slot) return

      slot.patternId = patternId
      saveGame() // <-- immediately persist
    },

    unlockSlot() {
      const slot = this.slots.find(s => !s.unlocked)
      if (!slot) return

      slot.unlocked = true
      saveGame()
    },

    cleanSlot(slot: any) {
      return {
        ...slot,
        progress: typeof slot.progress === "number" && !isNaN(slot.progress) ? slot.progress : 0,
        speedMultiplier: typeof slot.speedMultiplier === "number" ? slot.speedMultiplier : 1,
        outputMultiplier: typeof slot.outputMultiplier === "number" ? slot.outputMultiplier : 1,
      }
    },
    
    reset() {
      this.slots = this.getDefaultSlots.map(s => ({ ...s }))
    }
  }
})