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

    canPrestige: (state) => state.money >= 1e12
  },

  actions: {
    addMoney(amount: number) {
      this.money += amount
    },

    addExp(amount: number) {
      this.exp += amount
      this.checkLevelUp()
    },

    addDC(amount: number) {
      this.dc += amount
    },

    addPrestigePoints(amount: number) {
      if (isNaN(amount) || amount <= 0) return
      this.prestigePoints += amount
    },

    checkLevelUp() {
      while (this.exp >= this.expToNextLevel) {
        this.exp -= this.expToNextLevel
        this.level++
      }
    },

    setActivePattern(patternId: string) {
      this.activePattern = patternId
    },

    getPrestigeGain() {
      return Math.floor(Math.log10(this.money + 1))
    },

    prestige() {
      const gained = this.getPrestigeGain()// 1. calculate gain

      if (gained <= 0) return

      this.prestigePoints += gained
      // 2. reset all systems
      const patterns = usePatternStore()
      const slots = useSlotStore()
      const upgrades = useUpgradeStore()
      const machines = useMachineStore()

      this.resetRun()
      patterns.reset()
      slots.reset()
      upgrades.reset()
      machines.reset()

      saveGame()// 3. save
    },

    resetRun() {
      this.money = 0
      this.dc = 0
      this.level = 1
    }
  }
})