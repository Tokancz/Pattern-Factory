import { defineStore } from "pinia"
import { useSlotStore } from "./slot"
import { usePatternStore } from "./pattern"
import { saveGame } from "@/utils/save"
import { useUpgradeStore } from "./upgrade"
import { useMachineStore } from "./machine"

export const useGameStore = defineStore("game", {
  state: () => ({
    exp: 0,
    level: 1,

    money: 0,
    dc: 0,
    prestigePoints: 0,

    activePattern: "square" as string,

    unlockedSlots: 1,

    lastPlayed: Date.now()
  }),

  getters: {
    expToNextLevel: (state) => Math.floor(100 * Math.pow(1.2, state.level)),

    // Prestige requires 1M IGM to feel meaningful
    canPrestige: (state) => state.money >= 1_000_000
  },

  actions: {
    addMoney(amount: number) {
      if (isNaN(amount) || !isFinite(amount)) return
      this.money += amount
    },

    addExp(amount: number) {
      if (isNaN(amount) || !isFinite(amount)) return
      this.exp += amount
      this.checkLevelUp()
    },

    addDC(amount: number) {
      if (isNaN(amount) || !isFinite(amount)) return
      this.dc += amount
    },

    addPrestigePoints(amount: number) {
      if (isNaN(amount) || amount <= 0) return
      this.prestigePoints += amount
    },

    checkLevelUp() {
      let safety = 0
      while (this.exp >= this.expToNextLevel && safety < 1000) {
        this.exp -= this.expToNextLevel
        this.level++
        safety++
      }
    },

    setActivePattern(patternId: string) {
      this.activePattern = patternId
    },

    getPrestigeGain() {
      // PP = floor(log10(money / 10000)) — meaningful scaling
      // 1M IGM = 2 PP, 100M = 4 PP, 1B = 5 PP
      if (this.money < 1_000_000) return 0
      return Math.floor(Math.log10(this.money / 10_000))
    },

    prestige() {
      const gained = this.getPrestigeGain()
      if (gained <= 0) return

      this.prestigePoints += gained

      const patterns = usePatternStore()
      const slots = useSlotStore()
      const upgrades = useUpgradeStore()
      const machines = useMachineStore()

      this.resetRun()
      patterns.reset()   // resets pattern levels too
      slots.reset()
      upgrades.reset()   // keeps prestigeLevels
      machines.reset()

      saveGame()
    },

    resetRun() {
      this.money = 0
      this.dc = 0
      this.exp = 0
      this.level = 1
    }
  }
})