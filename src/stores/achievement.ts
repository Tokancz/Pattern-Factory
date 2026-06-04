import { defineStore } from "pinia"
import { ACHIEVEMENTS, type AchievementContext } from "@/data/achievements"
import { PATTERNS } from "@/data/patterns"
import { useGameStore } from "./game"
import { useGlyphStore } from "./glyph"
import { usePatternStore } from "./pattern"
import { playSound } from "@/utils/sound"
import { pushToast } from "@/composables/toast"
import { saveGame } from "@/utils/save"

const TOTAL_PATTERNS = Object.keys(PATTERNS).length

export const useAchievementStore = defineStore("achievements", {
  state: () => ({
    // Unlocked achievement ids. Permanent — never reset by prestige/ascend.
    unlocked: [] as string[]
  }),

  getters: {
    isUnlocked: (state) => (id: string) => state.unlocked.includes(id),
    unlockedCount: (state) => state.unlocked.length,
    total: () => ACHIEVEMENTS.length
  },

  actions: {
    buildContext(): AchievementContext {
      const game     = useGameStore()
      const glyph    = useGlyphStore()
      const patterns = usePatternStore()

      const levels = Object.values(patterns.patterns).map(p => p.level)

      return {
        money:                game.money,
        dc:                   game.dc,
        level:                game.level,
        prestigePoints:       game.prestigePoints,
        ascensionCount:       glyph.ascensionCount,
        glyphs:               glyph.glyphs,
        unlockedSlots:        game.unlockedSlots,
        unlockedPatternCount: patterns.unlockedPatterns.length,
        totalPatternCount:    TOTAL_PATTERNS,
        maxPatternLevel:      levels.length ? Math.max(...levels) : 0
      }
    },

    // Evaluate every locked achievement against the current state.
    // `silent` is used for the post-load backfill so an existing player isn't
    // buried under a toast for every condition they already satisfy.
    check(silent = false): void {
      const ctx = this.buildContext()
      let changed = false

      for (const def of ACHIEVEMENTS) {
        if (this.unlocked.includes(def.id)) continue
        if (!def.check(ctx)) continue

        this.unlocked.push(def.id)
        changed = true
        if (!silent) {
          pushToast(`Achievement unlocked — ${def.name}`, "achievement", { icon: def.icon })
          playSound("victory")
        }
      }

      if (changed) saveGame()
    }
  }
})
