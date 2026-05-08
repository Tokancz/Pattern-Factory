import { defineStore } from "pinia"
import { GLYPH_UPGRADES, TIER_UNLOCK_REQUIREMENT, ENDGAME_GLYPH_PATTERN_THRESHOLD } from "@/data/glyphUpgrades"
import type { GlyphUpgradeTier } from "@/data/glyphUpgrades"
import { usePatternStore } from "./pattern"
import { saveGame } from "@/utils/save"
import { playSound } from "@/utils/sound"

// Pinia store for the Reality Engine expansion's Ascension layer.
// Persisted server-side via the standard save flow (saveGame()/loadGame()
// in utils/save.ts). State here is reset by clear() and patched by the
// loader; mutating actions schedule a saveGame() so changes survive.

interface GlyphState {
  glyphs: number              // permanent, banked Glyphs
  pendingGlyphs: number       // accumulated this run, banks on Ascend
  ascensionCount: number      // lifetime — drives Architect titles
  glyphPatternCount: number   // lifetime — drives endgame trigger
  boughtUpgrades: Record<string, number>
  endgameState: null | "stabilized"
  seenIntro: boolean          // first-login flavour modal flag
}

const defaultState = (): GlyphState => ({
  glyphs: 0,
  pendingGlyphs: 0,
  ascensionCount: 0,
  glyphPatternCount: 0,
  boughtUpgrades: {},
  endgameState: null,
  seenIntro: false
})

export const useGlyphStore = defineStore("glyph", {
  state: defaultState,

  getters: {
    isStabilized: (state) => state.endgameState === "stabilized",

    upgradeLevel: (state) => (id: string) => state.boughtUpgrades[id] ?? 0,

    hasUpgrade: (state) => (id: string) => (state.boughtUpgrades[id] ?? 0) > 0,

    // Count of distinct owned upgrades within a tier — drives tier-gating
    // (Tier N+1 unlocks once TIER_UNLOCK_REQUIREMENT upgrades are owned in
    // Tier N).
    ownedCountInTier: (state) => (tier: GlyphUpgradeTier): number => {
      let count = 0
      for (const id of Object.keys(state.boughtUpgrades)) {
        const def = GLYPH_UPGRADES[id]
        if (def?.tier === tier && (state.boughtUpgrades[id] ?? 0) > 0) count++
      }
      return count
    },

    isTierUnlocked(): (tier: GlyphUpgradeTier) => boolean {
      return (tier: GlyphUpgradeTier): boolean => {
        if (tier === 1) return true
        // Recursive call needs `this` context; cast to call the getter.
        const prevOwned = (this as any).ownedCountInTier(tier - 1)
        return prevOwned >= TIER_UNLOCK_REQUIREMENT
      }
    },

    canBuyUpgrade(): (id: string) => boolean {
      return (id: string): boolean => {
        const def = GLYPH_UPGRADES[id]
        if (!def) return false
        const owned = (this as any).upgradeLevel(id) as number
        if (owned >= def.maxLevel) return false
        if (!(this as any).isTierUnlocked(def.tier)) return false
        if (def.needs && !(this as any).hasUpgrade(def.needs)) return false
        const cost = (this as any).nextLevelCost(id) as number
        return this.glyphs >= cost
      }
    },

    // Cost for the *next* purchase of this upgrade. Stackable upgrades
    // use `costPerLevel`; flat upgrades fall back to `cost`.
    nextLevelCost(): (id: string) => number {
      return (id: string): number => {
        const def = GLYPH_UPGRADES[id]
        if (!def) return 0
        const owned = (this as any).upgradeLevel(id) as number
        if (def.costPerLevel && def.costPerLevel[owned] !== undefined) {
          return def.costPerLevel[owned]!
        }
        return def.cost
      }
    },

    // Endgame trigger — the Architect's Choice fires once the player has
    // produced ENDGAME_GLYPH_PATTERN_THRESHOLD Γ patterns lifetime AND
    // owns Final Pattern. Already-stabilized accounts don't re-trigger.
    endgameAvailable(): boolean {
      if (this.endgameState === "stabilized") return false
      if (!(this as any).hasUpgrade("finalPattern")) return false
      return this.glyphPatternCount >= ENDGAME_GLYPH_PATTERN_THRESHOLD
    },

    endgameThreshold(): number {
      return ENDGAME_GLYPH_PATTERN_THRESHOLD
    }
  },

  actions: {
    // Reset to defaults. Used by ascension-style hard resets that don't
    // touch the server save (the saveGame() call afterwards persists).
    clear() {
      this.$patch(defaultState())
    },

    addPendingGlyphs(amount: number) {
      if (isNaN(amount) || amount <= 0) return
      this.pendingGlyphs += amount
    },

    setSeenIntro(seen: boolean) {
      if (this.seenIntro === seen) return
      this.seenIntro = seen
      saveGame()
    },

    // The Architect's Choice — Stabilize. Locks the engine in its
    // current state. The factory keeps running passively; the Architect
    // title becomes "Anchor". One-way, no path back without a fresh
    // account. (Compile is deferred to a future expansion — see § 6.)
    stabilize() {
      this.endgameState = "stabilized"
      saveGame()
      playSound("victory")
    },

    buyUpgrade(id: string): boolean {
      const def = GLYPH_UPGRADES[id]
      if (!def) return false

      const owned = this.upgradeLevel(id)
      const cost  = this.nextLevelCost(id)

      if (owned >= def.maxLevel)                    { playSound("error"); return false }
      if (!this.isTierUnlocked(def.tier))           { playSound("error"); return false }
      if (def.needs && !this.hasUpgrade(def.needs)) { playSound("error"); return false }
      if (this.glyphs < cost)                       { playSound("error"); return false }

      this.glyphs -= cost
      this.boughtUpgrades[id] = owned + 1
      playSound("buy")

      // Glyph Pattern unlocks the 5th pattern in the player's pool. Done
      // here so the patternStore reset() (called during prestige) only
      // needs to read the upgrade flag, not re-trigger this path.
      if (id === "glyphPattern") {
        usePatternStore().unlockPattern("glyph")
      }

      saveGame()
      return true
    }
  }
})
