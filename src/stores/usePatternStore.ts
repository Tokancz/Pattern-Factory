import { defineStore } from "pinia"
import { PATTERNS } from "@/data/patterns"

export const usePatternStore = defineStore("patterns", {
  state: () => ({
    patternLevels: {
      square: 1,
      triangle: 1,
      circle: 1,
      cross: 1
    } as Record<string, number>,

    unlockedPatterns: ["square"]
  }),

  getters: {
    getPatternLevel: (state) => (id: string) => {
      return state.patternLevels[id] || 1
    },

    getPatternValue: (state) => (id: string) => {
      const base = PATTERNS[id].baseValue
      const lvl = state.patternLevels[id] || 1

      return base * Math.pow(1.15, lvl)
    }
  },

  actions: {
    levelUpPattern(id: string) {
      this.patternLevels[id]++
    },

    unlockPattern(id: string) {
      if (!this.unlockedPatterns.includes(id)) {
        this.unlockedPatterns.push(id)
      }
    }
  }
})