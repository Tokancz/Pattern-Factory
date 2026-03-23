import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { useProgressStore } from "./progress"
import { UPGRADES } from "@/data/upgrades"

export const useUpgradeStore = defineStore("upgrades", {
  state: () => ({
    levels: {
      clickingPower: 0,
      sellMultiplier: 0,
      creationSpeed: 0,
      offlineCap: 0
    } as Record<string, number>
  }),

  getters: {
    getCost: (state) => (id: string) => {
      const base = UPGRADES[id].baseCost
      const lvl = state.levels[id]

      return Math.floor(base * Math.pow(UPGRADES[id].scale, lvl))
    }
  },

  actions: {
    buy(id: string) {
      const game = useGameStore()
      const progress = useProgressStore()

      const cost = this.getCost(id)
      if (game.money < cost) return

      game.money -= cost
      this.levels[id]++
      
      // APPLY EFFECTS HERE
      if (id === "clickingPower") {
        progress.clickPower *= 1.2
      }

      if (id === "creationSpeed") {
        progress.baseSpeed *= 1.1
      }
    }
  }
})