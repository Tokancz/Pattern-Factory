import { defineStore } from 'pinia'

export const usePatternStore = defineStore('pattern', {
  state: () => ({
    patterns: [],
    ownedPatterns: [],
    patternLevels: [],
  }),
})