import { defineStore } from 'pinia'

export const useProgressStore = defineStore('progress', {
  state: () => ({
    currentProgress: 0,
    creationSpeed: 10,
    clickPower: 1,
  }),
})