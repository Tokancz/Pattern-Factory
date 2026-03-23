import { defineStore } from "pinia"
import { PATTERNS } from "@/data/patterns"

export const usePatternStore = defineStore("patterns", {
  state: () => ({
    patterns: {
      square: { level: 1, exp: 0 },
      triangle: { level: 1, exp: 0 },
      circle: { level: 1, exp: 0 },
      cross: { level: 1, exp: 0 }
    } as Record<string, { level: number; exp: number }>,

    unlockedPatterns: ["square"]
  }),

  getters: {
    getPattern: (state) => (id: string) => state.patterns[id],

    expToNext: () => (lvl: number) => Math.floor(5 * Math.pow(1.5, lvl)),

    getPatternValue: (state) => (id: string) => {
      const base = PATTERNS[id].baseValue
      const lvl = state.patterns[id].level

      return base * Math.pow(1.5, lvl)
    }
  },

  actions: {
    addExp(id: string, amount: number) {
      const p = this.patterns[id]
      p.exp += amount

      while (p.exp >= this.expToNext(p.level)) {
        p.exp -= this.expToNext(p.level)
        p.level++
      }
    },

    unlockPattern(id: string) {
      if (!this.unlockedPatterns.includes(id)) {
        this.unlockedPatterns.push(id)
      }
    }
  }
})