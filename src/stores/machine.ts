import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { useSlotStore } from "./slot"
import { MACHINES } from "@/data/machines"
import { saveGame } from "@/utils/save"

export const useMachineStore = defineStore("machines", {
  state: () => ({
    levels: {
      slotUnlock: 0,
      slotBoost: 0,
      targetedBoost: 0,
      outputBoost: 0,
      expMachine: 0
    } as Record<string, number>
  }),

  getters: {
    getLevel: (state) => (id: string) => {
      return state.levels[id] || 0
    },

    getCost: (state) => (id: string) => {
      const lvl = state.levels[id] || 0
      const base = MACHINES[id].baseCost

      return Math.floor(base * Math.pow(MACHINES[id].scale, lvl))
    },

    getMultiplier: (state) => (id: string) => {
      const lvl = state.levels[id] || 0
      const machine = MACHINES[id]

      if (!machine || !machine.value) return 1

      return Math.pow(machine.value, lvl)
    }
  },

  actions: {
    buy(id: string) {
      const game = useGameStore()
      const slots = useSlotStore()

      const cost = this.getCost(id)
      if (game.money < cost) return

      game.money -= cost

      // increase level
      this.levels[id] = (this.levels[id] || 0) + 1

      const machine = MACHINES[id]

      // ✅ HANDLE INSTANT EFFECTS HERE
      if (machine.type === "unlockSlot") {
        slots.unlockSlot()
      }

      saveGame()
    },

    reset() {
      this.levels = {} // or default state
    }
  }
})