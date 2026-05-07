import { defineStore } from "pinia"
import { PATTERNS } from "@/data/patterns"
import { useUpgradeStore } from "./upgrade"
import { useGameStore } from "./game"
import { useGlyphStore } from "./glyph"
import { saveGame } from "@/utils/save"
import { playSound } from "@/utils/sound"

// Patterns whose unlock cost gets discounted by the Foundation Glyph upgrade.
const FOUNDATION_DISCOUNTED = new Set(["triangle", "circle", "cross"])

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

    // Effective unlock requirement for a pattern, after Glyph upgrades like
    // Foundation are applied. Returns 0 for resources the pattern doesn't
    // require, the discounted amount for triangle/circle/cross when
    // Foundation is owned, and the raw amount otherwise.
    getPatternUnlockCost: () => (id: string, resource: "money" | "dc"): number => {
      const p = PATTERNS[id as keyof typeof PATTERNS]
      if (!p?.requirements) return 0
      const req = p.requirements as Record<string, number>
      const base = req[resource] ?? 0
      if (base === 0) return 0

      const glyph = useGlyphStore()
      if (glyph.hasUpgrade("foundation") && FOUNDATION_DISCOUNTED.has(id)) {
        return Math.floor(base * 0.5)
      }
      return base
    },

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
      const moneyCost = this.getPatternUnlockCost(id, "money")
      const dcCost    = this.getPatternUnlockCost(id, "dc")

      if (moneyCost > 0 && game.money < moneyCost)                   { playSound("error"); return false }
      if (dcCost > 0    && game.dc    < dcCost)                      { playSound("error"); return false }
      if ("level" in req && req.level !== undefined && game.level < req.level) { playSound("error"); return false }

      if (moneyCost > 0) game.money -= moneyCost
      if (dcCost > 0)    game.dc    -= dcCost

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