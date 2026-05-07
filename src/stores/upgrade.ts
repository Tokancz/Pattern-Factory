import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { useGlyphStore } from "./glyph"
import { UPGRADES, DC_UPGRADES, PRESTIGE_UPGRADES } from "@/data/upgrades"
import { saveGame } from "@/utils/save"
import { playSound } from "@/utils/sound"

export const useUpgradeStore = defineStore("upgrades", {
  state: () => ({
    levels: {
      clickingPower: 0,
      sellMultiplier: 0,
      creationSpeed: 0,
      expGain: 0,
      offlineCap: 0,
      offlineGain: 0
    } as Record<string, number>,

    dcLevels: {
      squareSpeed: 0,
      squareOutput: 0,
      triangleSpeed: 0,
      triangleOutput: 0,
      crossSpeed: 0,
      crossOutput: 0
    } as Record<string, number>,

    prestigeLevels: {
      prestigeOutput: 0,
      prestigeSpeed: 0,
      prestigeClick: 0
    } as Record<string, number>
  }),

  getters: {
    getCost: (state) => (id: string) => {
      const upgrade = UPGRADES[id as keyof typeof UPGRADES]
      if (!upgrade) return Infinity
      const lvl = state.levels[id] ?? 0
      return Math.floor(upgrade.baseCost * Math.pow(upgrade.scale, lvl))
    },

    getDcCost: (state) => (id: string) => {
      const upgrade = DC_UPGRADES[id as keyof typeof DC_UPGRADES]
      if (!upgrade) return Infinity
      const lvl = state.dcLevels[id] ?? 0
      return Math.floor(upgrade.baseCost * Math.pow(upgrade.scale, lvl))
    },

    getPrestigeCost: (state) => (id: string) => {
      const upgrade = PRESTIGE_UPGRADES[id as keyof typeof PRESTIGE_UPGRADES]
      if (!upgrade) return Infinity
      const lvl = state.prestigeLevels[id] ?? 0
      return Math.floor(upgrade.baseCost * Math.pow(upgrade.scale, lvl))
    },

    getOfflineCap: (state) => {
      const lvl = state.levels.offlineCap ?? 0
      let cap = 3600 + lvl * 1800

      // Time Dilation Glyph upgrade multiplies the cap by 1.5×.
      const glyph = useGlyphStore()
      if (glyph.hasUpgrade("timeDilation")) cap = Math.floor(cap * 1.5)

      return cap
    },

    getOfflineGainMultiplier: (state) => {
      return 1 + (state.levels.offlineGain ?? 0) * 0.10
    },

    getClickPower: (state) => {
      const lvl = Math.min(state.levels.clickingPower ?? 0, 10)
      const base = 4 + lvl * 9 
      const prestigeBonus = 1 + (state.prestigeLevels.prestigeClick ?? 0) * 0.2
      return Math.min(base * prestigeBonus, 150)
    },

    getSpeedMultiplier: (state) => {
      const base = Math.pow(1.08, state.levels.creationSpeed ?? 0)
      const prestigeBonus = 1 + (state.prestigeLevels.prestigeSpeed ?? 0) * 0.1
      return base * prestigeBonus
    },

    getExpMultiplier: (state) => {
      return 1 + (state.levels.expGain ?? 0) * 0.15
    },

    getSellMultiplier: (state) => {
      return Math.pow(1.15, state.levels.sellMultiplier ?? 0)
    },

    getPrestigeOutputBonus: (state) => {
      return 1 + (state.prestigeLevels.prestigeOutput ?? 0) * 0.15
    },

    // Per-pattern DC multipliers — 10% per level for speed, 15% per level for output
    getDcSpeedMultiplier: (state) => (patternId: string) => {
      const key = `${patternId}Speed`
      const lvl = state.dcLevels[key] ?? 0
      return 1 + lvl * 0.10
    },

    getDcOutputMultiplier: (state) => (patternId: string) => {
      const key = `${patternId}Output`
      const lvl = state.dcLevels[key] ?? 0
      return 1 + lvl * 0.15
    }
  },

  actions: {
    buy(id: string) {
      const game = useGameStore()
      const upgrade = UPGRADES[id as keyof typeof UPGRADES]
      if (!upgrade) return

      if ("maxLevel" in upgrade && (this.levels[id] ?? 0) >= (upgrade.maxLevel as number)) {
        playSound("error")
        return
      }

      const cost = this.getCost(id)
      if (game.money < cost) { playSound("error"); return }

      game.money -= cost
      this.levels[id] = (this.levels[id] ?? 0) + 1
      playSound("buy")
      saveGame()
    },

    buyDc(id: string) {
      const game = useGameStore()
      const upgrade = DC_UPGRADES[id as keyof typeof DC_UPGRADES]
      if (!upgrade) return

      const cost = this.getDcCost(id)
      if (game.dc < cost) { playSound("error"); return }

      game.dc -= cost
      this.dcLevels[id] = (this.dcLevels[id] ?? 0) + 1
      playSound("buy")
      saveGame()
    },

    buyPrestige(id: string) {
      const game = useGameStore()
      const upgrade = PRESTIGE_UPGRADES[id as keyof typeof PRESTIGE_UPGRADES]
      if (!upgrade) return

      const cost = this.getPrestigeCost(id)
      if (game.prestigePoints < cost) { playSound("error"); return }

      game.prestigePoints -= cost
      this.prestigeLevels[id] = (this.prestigeLevels[id] ?? 0) + 1
      playSound("buy")
      saveGame()
    },

    reset() {
      // Wipe regular and DC upgrade levels on prestige. Prestige levels
      // survive (they're paid for in PP, which only ascension resets).
      // The Tier 4 Glyph upgrade "Pattern Memory" will later let DC
      // upgrades persist through prestige; for now, always wipe.
      this.levels = {
        clickingPower: 0,
        sellMultiplier: 0,
        creationSpeed: 0,
        expGain: 0,
        offlineCap: 0,
        offlineGain: 0
      }
      this.dcLevels = {
        squareSpeed: 0,
        squareOutput: 0,
        triangleSpeed: 0,
        triangleOutput: 0,
        crossSpeed: 0,
        crossOutput: 0
      }
    },

    resetAll() {
      // Full wipe used by ascension. Clears every upgrade tier including
      // PP-tier upgrades, which `reset()` deliberately keeps.
      this.reset()
      this.prestigeLevels = {
        prestigeOutput: 0,
        prestigeSpeed: 0,
        prestigeClick: 0
      }
    }
  }
})