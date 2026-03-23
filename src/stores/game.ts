import { defineStore } from "pinia"

export const useGameStore = defineStore("game", {
  state: () => ({
    money: 0,
    exp: 0,
    level: 1,

    dc: 0,
    prestigePoints: 0,

    activePattern: "square" as string,

    unlockedSlots: 1,

    lastPlayed: Date.now()
  }),

  getters: {
    expToNextLevel: (state) => Math.floor(100 * Math.pow(1.2, state.level)),
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

    checkLevelUp() {
      while (this.exp >= this.expToNextLevel) {
        this.exp -= this.expToNextLevel
        this.level++
      }
    },

    setActivePattern(patternId: string) {
      this.activePattern = patternId
    },

    prestige() {
      if (this.money < 1e12) return

      const gained = Math.floor(Math.log10(this.money) / 3)

      this.prestigePoints += gained

      // reset
      this.money = 0
      this.exp = 0
      this.level = 1
      this.unlockedSlots = 1
    }
  }
})