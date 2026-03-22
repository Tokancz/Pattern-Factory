import { defineStore } from 'pinia'

export const useUpgradeStore = defineStore('upgrade', {
  state: () => ({
    upgrades: [],
    machines: [],
  }),
})