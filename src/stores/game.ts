import { defineStore } from "pinia"
import { useSlotStore } from "./slot"
import { usePatternStore } from "./pattern"
import { saveGame } from "@/utils/save"
import { useUpgradeStore } from "./upgrade"
import { useMachineStore } from "./machine"
import { playSound } from "@/utils/sound"

export const useGameStore = defineStore("game", {
  state: () => ({
    exp: 0,
    level: 1,

    money: 0,
    dc: 0,
    prestigePoints: 0,
    pendingPrestigePoints: 0,

    activePattern: "square" as string,

    unlockedSlots: 1,

    lastPlayed: Date.now()
  }),

  getters: {
    expToNextLevel: (state) => Math.floor(100 * Math.pow(1.2, state.level)),

    canPrestige: (state) => state.money >= 1_000_000 || state.pendingPrestigePoints > 0
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

    addPendingPrestigePoints(amount: number) {
      if (isNaN(amount) || amount <= 0) return
      this.pendingPrestigePoints += amount
    },

    checkLevelUp() {
      let safety = 0
      let leveled = false
      while (this.exp >= this.expToNextLevel && safety < 1000) {
        this.exp -= this.expToNextLevel
        this.level++
        leveled = true
        safety++
      }
      if (leveled) playSound("magic")
    },

    setActivePattern(patternId: string) {
      this.activePattern = patternId
    },

    getMoneyPrestigeGain() {
      // sqrt scaling: 1M = 3PP, 4M = 6PP, 9M = 9PP, 25M = 15PP
      if (this.money < 1_000_000) return 0
      return Math.floor(Math.sqrt(this.money / 100_000))
    },

    getPrestigeGain() {
      return this.getMoneyPrestigeGain() + Math.floor(this.pendingPrestigePoints)
    },

    prestige() {
      const gained = this.getPrestigeGain()
      if (gained <= 0) return

      this.prestigePoints += gained
      this.pendingPrestigePoints = 0

      const patterns = usePatternStore()
      const slots = useSlotStore()
      const upgrades = useUpgradeStore()
      const machines = useMachineStore()

      this.resetRun()
      patterns.reset()
      slots.reset()
      upgrades.reset()   // keeps dcLevels and prestigeLevels
      machines.reset()

      saveGame()
    },

    resetRun() {
      this.money = 0
      // DC does NOT reset
      this.exp = 0
      this.level = 1
    }
  }
})