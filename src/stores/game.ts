import { defineStore } from "pinia"
import { useSlotStore } from "./slot"
import { usePatternStore } from "./pattern"
import { saveGame } from "@/utils/save"
import { useUpgradeStore } from "./upgrade"
import { useMachineStore } from "./machine"
import { useGlyphStore } from "./glyph"
import { playSound } from "@/utils/sound"

const ASCEND_LEVEL = 75
const PRESTIGE_THRESHOLD_BASE = 1_000_000
const PRESTIGE_THRESHOLD_BOOSTED = 500_000  // Glyph upgrade: Threshold

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

    // Glyph upgrade "Threshold" lowers the IGM bar from 1M to 500k.
    prestigeThreshold(): number {
      const glyph = useGlyphStore()
      return glyph.hasUpgrade("threshold") ? PRESTIGE_THRESHOLD_BOOSTED : PRESTIGE_THRESHOLD_BASE
    },

    canPrestige(): boolean {
      return this.money >= this.prestigeThreshold || this.pendingPrestigePoints > 0
    },

    // Premature Ascent Glyph upgrade lowers the bar by 5 per level
    // (max 5 levels → floor of 50).
    ascendLevel(): number {
      const glyph = useGlyphStore()
      return ASCEND_LEVEL - glyph.upgradeLevel("prematureAscent") * 5
    },

    canAscend(): boolean {
      return this.level >= this.ascendLevel
    }
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
      // sqrt scaling: 1M = 3PP, 4M = 6PP, 9M = 9PP, 25M = 15PP.
      // Glyph upgrade "Threshold" lowers the floor to 500k.
      if (this.money < this.prestigeThreshold) return 0
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
      playSound("magic")

      const patterns = usePatternStore()
      const slots = useSlotStore()
      const upgrades = useUpgradeStore()
      const machines = useMachineStore()
      const glyph = useGlyphStore()

      // Stable Loop (Tier 2): pick one currently-unlocked non-square
      // pattern to preserve through the wipe. Square is always re-unlocked
      // by patterns.reset(), so it's excluded from the pool.
      let preserved: string | null = null
      if (glyph.hasUpgrade("stableLoop")) {
        const pool = patterns.unlockedPatterns.filter(p => p !== "square")
        if (pool.length > 0) {
          preserved = pool[Math.floor(Math.random() * pool.length)]!
        }
      }

      this.resetRun()
      patterns.reset()
      slots.reset()
      upgrades.reset()   // wipes normal + dcLevels; keeps prestigeLevels
      machines.reset()

      // Boot Sequence (Tier 1): grant a free DC stockpile after the wipe.
      if (glyph.hasUpgrade("bootSequence")) this.dc = 100
      // Stable Loop: re-unlock the preserved pattern.
      if (preserved) patterns.unlockPattern(preserved)

      saveGame()
    },

    ascend() {
      // Ascension is a deeper reset than prestige: bank pending Glyphs,
      // wipe PP/DC/levels and every upgrade tier. Glyph state itself is
      // preserved (it lives in its own store and persists separately).
      if (!this.canAscend) return

      const glyph = useGlyphStore()

      // 1 base Glyph for crossing the ascend threshold + Manifold
      // bonus (+1 per level, max +5) + any pending Glyphs from this run.
      const gained = 1 + glyph.upgradeLevel("manifold") + Math.floor(glyph.pendingGlyphs)
      glyph.glyphs += gained
      glyph.pendingGlyphs = 0
      glyph.ascensionCount += 1
      playSound("victory")
      // No explicit Glyph save needed — saveGame() at the bottom of this
      // action persists everything (including the Glyph state) in one PUT.

      // Wipe everything else
      const patterns = usePatternStore()
      const slots    = useSlotStore()
      const upgrades = useUpgradeStore()
      const machines = useMachineStore()

      this.resetRun()
      this.prestigePoints        = 0
      this.pendingPrestigePoints = 0
      patterns.reset()
      slots.reset()
      upgrades.resetAll()  // includes prestigeLevels
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