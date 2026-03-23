import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { usePatternStore } from "./pattern"
import { PATTERNS } from "@/data/patterns"

export const useProgressStore = defineStore("progress", {
  state: () => ({
    progress: 0,
    maxProgress: 100,

    baseSpeed: 1,
    clickPower: 1
  }),

  getters: {
    progressPercent: (state) => state.progress / state.maxProgress
  },

  actions: {
    tick(delta: number) {
      this.progress += delta * this.baseSpeed

      if (this.progress >= this.maxProgress) {
        this.complete()
      }
    },

    click() {
      this.progress += this.clickPower
    },

    complete() {
      const game = useGameStore()
      const patterns = usePatternStore()

      const patternId = game.activePattern
      const value = patterns.getPatternValue(patternId)

      // reward system
      const type = PATTERNS[patternId].type

      if (type === "money") game.addMoney(value)
      if (type === "exp") game.addExp(value)
      if (type === "dc") game.addDC(value)

      // level up pattern
      patterns.levelUpPattern(patternId)

      this.progress = 0
    }
  }
})