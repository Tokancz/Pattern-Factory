import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { usePatternStore } from "./pattern"
import { PATTERNS } from "@/data/patterns"

interface Slot {
  id: number
  patternId: string | null
  progress: number
  unlocked: boolean
}

export const useSlotStore = defineStore("slots", {
  state: () => ({
    slots: [
      { id: 0, patternId: "square", progress: 0, unlocked: true },
      { id: 1, patternId: null, progress: 0, unlocked: false },
      { id: 2, patternId: null, progress: 0, unlocked: false },
      { id: 3, patternId: null, progress: 0, unlocked: false }
    ],

    maxProgress: 100,
    baseSpeed: 1
  }),

  actions: {
    tick(delta: number) {
      const game = useGameStore()
      const patterns = usePatternStore()

      this.slots.forEach(slot => {
        if (!slot.unlocked || !slot.patternId) return

        slot.progress += delta * this.baseSpeed

        if (slot.progress >= this.maxProgress) {
          this.completeSlot(slot, game, patterns)
        }
      })
    },

    clickSlot(slotId: number) {
      const slot = this.slots.find(s => s.id === slotId)
      if (!slot || !slot.patternId) return

      slot.progress += 5 // later scale with upgrades
    },

    completeSlot(slot: Slot, game: any, patterns: any) {
      const value = patterns.getPatternValue(slot.patternId)
      const type = PATTERNS[slot.patternId].type

      if (type === "money") game.addMoney(value)
      if (type === "exp") game.addExp(value)
      if (type === "dc") game.addDC(value)

      patterns.addExp(slot.patternId, 1)

      slot.progress = 0
    },

    unlockSlot() {
      const locked = this.slots.find(s => !s.unlocked)
      if (locked) locked.unlocked = true
    },

    assignPattern(slotId: number, patternId: string) {
      const slot = this.slots.find(s => s.id === slotId)
      if (!slot) return

      slot.patternId = patternId
    }
  }
})