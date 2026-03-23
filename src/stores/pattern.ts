import { defineStore } from "pinia"
import { PATTERNS } from "@/data/patterns"
import { useUpgradeStore } from "./upgrade"
import { useGameStore } from "./game"
import { saveGame } from "@/utils/save"

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

      // fix: level 1 = base value
      let value = base * Math.pow(1.5, lvl - 1)

      // inject upgrades
      const upgrades = useUpgradeStore()
      const type = PATTERNS[id].type

      if (type === "money") {
        value *= 1 + (upgrades.levels.sellMultiplier || 0) * 0.5
      }

      return value
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
    },

    buyPattern(id: string) {
      const game = useGameStore()
      const p = PATTERNS[id]

      if (this.unlockedPatterns.includes(id)) return false
      if (!p.requirements) {
        this.unlockPattern(id)
        return true
      }

      // check requirements
      const req = p.requirements

      if (req.money && game.money < req.money) return false
      if (req.dc && game.dc < req.dc) return false
      if (req.level && game.level < req.level) return false

      // passed all checks → unlock and deduct resources if needed
      if (req.money) game.money -= req.money
      if (req.dc) game.dc -= req.dc

      this.unlockPattern(id)
      saveGame()
      return true
    }
  }
})