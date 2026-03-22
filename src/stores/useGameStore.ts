import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    money: 0,
    exp: 0,
    level: 1,
    dc: 0,
    prestigePoints: 0,
    activePattern: null,
    unlockedSlots: 1,
  }),
})