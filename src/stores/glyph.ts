import { defineStore } from "pinia"
import { GLYPH_UPGRADES, TIER_UNLOCK_REQUIREMENT } from "@/data/glyphUpgrades"
import type { GlyphUpgradeTier } from "@/data/glyphUpgrades"
import { useUserStore } from "./user"
import { usePatternStore } from "./pattern"
import { playSound } from "@/utils/sound"

// Pinia store for the Reality Engine expansion's Ascension layer.
//
// Phase 1 step 2: data shape + per-user localStorage persistence only.
// Mutation actions (gainPendingGlyphs, ascend, buyUpgrade) land in later
// steps when the rest of the ascension flow exists.
//
// Backend migration is intentionally deferred — once the schema gets the
// glyph_state columns, swap localStorage for the server-backed save.

const STORAGE_PREFIX = "patternfactory:glyphState:"

interface GlyphState {
  glyphs: number              // permanent, banked Glyphs
  pendingGlyphs: number       // accumulated this run, banks on Ascend
  ascensionCount: number      // lifetime — drives Architect titles
  glyphPatternCount: number   // lifetime — drives endgame trigger
  boughtUpgrades: Record<string, number>
  endgameState: null | "stabilized"
}

const defaultState = (): GlyphState => ({
  glyphs: 0,
  pendingGlyphs: 0,
  ascensionCount: 0,
  glyphPatternCount: 0,
  boughtUpgrades: {},
  endgameState: null
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
    }
  },

  actions: {
    load(userId: number | undefined) {
      if (userId === undefined) return
      const raw = localStorage.getItem(STORAGE_PREFIX + userId)
      if (!raw) {
        this.$patch(defaultState())
        return
      }
      try {
        const parsed = JSON.parse(raw) as Partial<GlyphState>
        this.$patch({
          glyphs:            parsed.glyphs            ?? 0,
          pendingGlyphs:     parsed.pendingGlyphs     ?? 0,
          ascensionCount:    parsed.ascensionCount    ?? 0,
          glyphPatternCount: parsed.glyphPatternCount ?? 0,
          boughtUpgrades:    parsed.boughtUpgrades    ?? {},
          endgameState:      parsed.endgameState      ?? null
        })
      } catch {
        this.$patch(defaultState())
      }
    },

    save(userId: number | undefined) {
      if (userId === undefined) return
      const payload: GlyphState = {
        glyphs:            this.glyphs,
        pendingGlyphs:     this.pendingGlyphs,
        ascensionCount:    this.ascensionCount,
        glyphPatternCount: this.glyphPatternCount,
        boughtUpgrades:    { ...this.boughtUpgrades },
        endgameState:      this.endgameState
      }
      localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(payload))
    },

    clear() {
      this.$patch(defaultState())
    },

    buyUpgrade(id: string): boolean {
      const def = GLYPH_UPGRADES[id]
      if (!def) return false

      const owned = this.upgradeLevel(id)
      const cost  = this.nextLevelCost(id)

      if (owned >= def.maxLevel)                                 { playSound("error"); return false }
      if (!this.isTierUnlocked(def.tier))                        { playSound("error"); return false }
      if (def.needs && !this.hasUpgrade(def.needs))              { playSound("error"); return false }
      if (this.glyphs < cost)                                    { playSound("error"); return false }

      this.glyphs -= cost
      this.boughtUpgrades[id] = owned + 1
      playSound("buy")

      // Glyph Pattern unlocks the 5th pattern in the player's pool. Done
      // here so the patternStore reset() (called during prestige) only
      // needs to read the upgrade flag, not re-trigger this path.
      if (id === "glyphPattern") {
        usePatternStore().unlockPattern("glyph")
      }

      const user = useUserStore()
      this.save(user.user?.id)
      return true
    }
  }
})
