import { defineStore } from "pinia"
import { useSlotStore } from "./slot"
import { usePatternStore } from "./pattern"
import { saveGame } from "@/utils/save"
import { useUpgradeStore } from "./upgrade"
import { useMachineStore } from "./machine"
import { useGlyphStore } from "./glyph"
import { useUserStore } from "./user"
import { playSound } from "@/utils/sound"

const ASCEND_LEVEL = 100
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

    canAscend: (state) => state.level >= ASCEND_LEVEL
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
      const user  = useUserStore()

      // 1 base Glyph for crossing the level-100 threshold + any pending
      // Glyphs accumulated this run (only non-zero once the 5th pattern
      // ships in Step 4).
      const gained = 1 + Math.floor(glyph.pendingGlyphs)
      glyph.glyphs += gained
      glyph.pendingGlyphs = 0
      glyph.ascensionCount += 1
      glyph.save(user.user?.id)

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