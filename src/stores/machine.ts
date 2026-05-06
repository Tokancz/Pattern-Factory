import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { useSlotStore } from "./slot"
import { MACHINES } from "@/data/machines"
import { saveGame } from "@/utils/save"
import { playSound } from "@/utils/sound"

const MAX_SLOTS = 4

export const useMachineStore = defineStore("machines", {
  state: () => ({
    levels: {
      slotUnlock: 0,
      slotBoost: 0,
      targetedBoost: 0,
      outputBoost: 0,
      expMachine: 0,
      synergyBoost: 0
    } as Record<string, number>
  }),

  getters: {
    getLevel: (state) => (id: string) => {
      return state.levels[id] || 0
    },

    getCost: (state) => (id: string) => {
      const lvl = state.levels[id] || 0
      const machine = MACHINES[id as keyof typeof MACHINES]
      if (!machine) return 0

      return Math.floor(machine.baseCost * Math.pow(machine.scale, lvl))
    },

    getMultiplier: (state) => (id: string) => {
      const lvl = state.levels[id] || 0
      const machine = MACHINES[id as keyof typeof MACHINES]

      if (!machine || !('value' in machine)) return 1

      return Math.pow(machine.value, lvl)
    },

    // Check if slotUnlock is maxed (all 4 slots unlocked)
    isSlotUnlockMaxed: (_state) => {
      const slots = useSlotStore()
      return slots.slots.filter(s => s.unlocked).length >= MAX_SLOTS
    }
  },

  actions: {
    buy(id: string) {
      const game = useGameStore()
      const slots = useSlotStore()

      // Prevent buying more slot unlocks if all slots are already unlocked
      if (id === "slotUnlock") {
        const unlockedCount = slots.slots.filter(s => s.unlocked).length
        if (unlockedCount >= MAX_SLOTS) { playSound("error"); return }
      }

      const cost = this.getCost(id)
      if (game.money < cost) { playSound("error"); return }

      game.money -= cost

      // increase level
      this.levels[id] = (this.levels[id] || 0) + 1

      const machine = MACHINES[id as keyof typeof MACHINES]

      // HANDLE INSTANT EFFECTS
      if (machine.type === "unlockSlot") {
        slots.unlockSlot()
      }

      playSound("buy")
      saveGame()
    },

    reset() {
      this.levels = {
        slotUnlock: 0,
        slotBoost: 0,
        targetedBoost: 0,
        outputBoost: 0,
        expMachine: 0,
        synergyBoost: 0
      }
    }
  }
})