import { defineStore } from "pinia"
import { PATTERNS } from "@/data/patterns"
import { useUpgradeStore } from "./upgrade"
import { useGameStore } from "./game"
import { saveGame } from "@/utils/save"
import { playSound } from "@/utils/sound"

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

    expToNext: () => (lvl: number) => Math.floor(10 * Math.pow(1.5, lvl)),

    // getPatternValue includes ALL multipliers so Inventory shows the real
    // value a slot will produce — including prestige bonus, sell multiplier,
    // AND DC output upgrades per pattern.
    getPatternValue: (state) => (id: string) => {
      if (!(id in PATTERNS)) return 0
      const p = state.patterns[id]
      if (!p) return 0
      const base = PATTERNS[id as keyof typeof PATTERNS].baseValue
      const lvl = p.level

      // Level 1 = base value, each level ×1.5
      let value = base * Math.pow(1.5, lvl - 1)

      const upgrades = useUpgradeStore()
      const type = PATTERNS[id as keyof typeof PATTERNS].type

      if (type === "money") {
        value *= upgrades.getSellMultiplier
      }

      // Include prestige output bonus
      value *= upgrades.getPrestigeOutputBonus

      // Include DC output multiplier for this specific pattern
      value *= upgrades.getDcOutputMultiplier(id)

      return value
    }
  },

  actions: {
    addExp(id: string, amount: number) {
      const p = this.patterns[id]

      if (!p || isNaN(amount)) {
        console.warn("Invalid EXP:", id, amount)
        return
      }

      p.exp += amount

      let needed = this.expToNext(p!.level)

      while (p!.exp >= needed) {
        p!.exp -= needed
        p!.level++
        needed = this.expToNext(p!.level)
      }
    },

    unlockPattern(id: string) {
      if (!this.unlockedPatterns.includes(id)) {
        this.unlockedPatterns.push(id)
      }
    },

    buyPattern(id: string) {
      const game = useGameStore()
      const p = PATTERNS[id as keyof typeof PATTERNS]

      if (this.unlockedPatterns.includes(id)) return false
      if (!p.requirements) {
        this.unlockPattern(id)
        return true
      }

      const req = p.requirements

      if (req && "money" in req && game.money < req.money) { playSound("error"); return false }
      if (req && "dc" in req && game.dc < req.dc) { playSound("error"); return false }
      if (req && "level" in req && game.level < req.level) { playSound("error"); return false }

      if ("money" in req && req.money !== undefined) game.money -= req.money
      if ("dc" in req && req.dc !== undefined) game.dc -= req.dc

      this.unlockPattern(id)
      playSound("buy")
      saveGame()
      return true
    },

    reset() {
      this.patterns = {
        square: { level: 1, exp: 0 },
        triangle: { level: 1, exp: 0 },
        circle: { level: 1, exp: 0 },
        cross: { level: 1, exp: 0 }
      }

      this.unlockedPatterns = ["square"]
    }
  }
})