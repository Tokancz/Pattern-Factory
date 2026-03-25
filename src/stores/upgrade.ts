import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { UPGRADES } from "@/data/upgrades"
import { saveGame } from "@/utils/save"

export const useUpgradeStore = defineStore("upgrades", {
  state: () => ({
    levels: {
      clickingPower: 0,
      sellMultiplier: 0,
      creationSpeed: 0,
      expGain: 0,
      offlineCap: 0,
      offlineGain: 0,
      prestigeOutput: 0
    } as Record<string, number>
  }),

  getters: {
    getCost: (state) => (id: string) => {
      const base = UPGRADES[id].baseCost
      const lvl = state.levels[id]

      return Math.floor(base * Math.pow(UPGRADES[id].scale, lvl))
    },
    getOfflineCap: (state) => {
      const lvl = state.levels.offlineCap || 0

      const base = 3600 // 1 hour
      const perLevel = 1800 // +30 min per level

      return base + lvl * perLevel 
    },
    getClickPower: (state) => Math.pow(1.2, state.levels.clickingPower || 0),

    getSpeedMultiplier: (state) => Math.pow(1.1, state.levels.creationSpeed || 0),

    getExpMultiplier: (state) => 1 + (state.levels.expGain || 0) * 0.25,

    getSellMultiplier: (state) => Math.pow(1.25, state.levels.sellMultiplier || 0)
  },

  actions: {
    buy(id: string) {
      const game = useGameStore()
      const cost = this.getCost(id)

      if (UPGRADES[id].currency === "prestige") {
        if (game.prestigePoints < cost) return
        game.prestigePoints -= cost
      }
      else if (UPGRADES[id].currency === "money") {
        if (game.money < cost) return
        game.money -= cost
      }

      this.levels[id]++

      saveGame()
    },

    reset() {
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