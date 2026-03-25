import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { UPGRADES, PRESTIGE_UPGRADES } from "@/data/upgrades"
import { saveGame } from "@/utils/save"

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

    getPrestigeCost: (state) => (id: string) => {
      const upgrade = PRESTIGE_UPGRADES[id as keyof typeof PRESTIGE_UPGRADES]
      if (!upgrade) return Infinity
      const lvl = state.prestigeLevels[id] ?? 0
      return Math.floor(upgrade.baseCost * Math.pow(upgrade.scale, lvl))
    },

    getOfflineCap: (state) => {
      const lvl = state.levels.offlineCap ?? 0
      return 3600 + lvl * 1800 // 1 hour base + 30 min per level
    },

    // Click power: each level adds 10, capped at level 10 = 100
    getClickPower: (state) => {
      const lvl = Math.min(state.levels.clickingPower ?? 0, 10)
      const base = 5 + lvl * 9 // level 0 = 1, level 10 = 91 (~100 with prestige)
      const prestigeBonus = 1 + (state.prestigeLevels.prestigeClick ?? 0) * 0.2
      return Math.min(base * prestigeBonus, 150) // hard cap at 150
    },

    // Speed: weaker scaling — 1.08 per level instead of 1.1
    getSpeedMultiplier: (state) => {
      const base = Math.pow(1.08, state.levels.creationSpeed ?? 0)
      const prestigeBonus = 1 + (state.prestigeLevels.prestigeSpeed ?? 0) * 0.1
      return base * prestigeBonus
    },

    getExpMultiplier: (state) => {
      return 1 + (state.levels.expGain ?? 0) * 0.15 // 0.15 per level instead of 0.25
    },

    // Sell multiplier: 1.15 per level instead of 1.25
    getSellMultiplier: (state) => {
      return Math.pow(1.15, state.levels.sellMultiplier ?? 0)
    },

    // Prestige output bonus applied in slot store
    getPrestigeOutputBonus: (state) => {
      return 1 + (state.prestigeLevels.prestigeOutput ?? 0) * 0.15
    }
  },

  actions: {
    buy(id: string) {
      const game = useGameStore()
      const upgrade = UPGRADES[id as keyof typeof UPGRADES]
      if (!upgrade) return

      // Check max level
      if ("maxLevel" in upgrade && (this.levels[id] ?? 0) >= (upgrade.maxLevel as number)) return

      const cost = this.getCost(id)

      if (upgrade.currency === "money") {
        if (game.money < cost) return
        game.money -= cost
      }

      this.levels[id] = (this.levels[id] ?? 0) + 1
      saveGame()
    },

    buyPrestige(id: string) {
      const game = useGameStore()
      const upgrade = PRESTIGE_UPGRADES[id as keyof typeof PRESTIGE_UPGRADES]
      if (!upgrade) return

      const cost = this.getPrestigeCost(id)
      if (game.prestigePoints < cost) return

      game.prestigePoints -= cost
      this.prestigeLevels[id] = (this.prestigeLevels[id] ?? 0) + 1
      saveGame()
    },

    reset() {
      // Only reset regular upgrades, prestige levels survive
      this.levels = {
        clickingPower: 0,
        sellMultiplier: 0,
        creationSpeed: 0,
        expGain: 0,
        offlineCap: 0,
        offlineGain: 0
      }
    }
  }
})