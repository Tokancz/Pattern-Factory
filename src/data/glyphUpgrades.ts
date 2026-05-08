// Glyph upgrade definitions for the Reality Engine expansion.
// Tier 1 + Tier 2 ship in Step 4. Tier 3 + Tier 4 land in later steps.
//
// Each upgrade has a flat cost (no per-level scaling for now) since
// every upgrade is single-purchase. Cross Resolution (Tier 3) is the
// only stackable one and will use a `costPerLevel` array.

export type GlyphUpgradeTier = 1 | 2 | 3 | 4

export interface GlyphUpgrade {
  id: string
  name: string
  description: string
  tier: GlyphUpgradeTier
  cost: number          // base cost in Glyphs (used when costPerLevel absent)
  maxLevel: number      // 1 for non-stackable; >1 for stackable
  costPerLevel?: number[] // explicit cost for each level (for stackables)
  needs?: string        // prerequisite upgrade id
}

export const GLYPH_UPGRADES: Record<string, GlyphUpgrade> = {
  // ─── Tier 1 — Foothold ────────────────────────────────────────────────
  slotV: {
    id: "slotV",
    name: "Slot V",
    description: "Unlock the 5th thread. Prestige now starts you with 2 unlocked threads.",
    tier: 1,
    cost: 2,
    maxLevel: 1
  },
  bootSequence: {
    id: "bootSequence",
    name: "Boot Sequence",
    description: "Start each prestige with 100 free DC.",
    tier: 1,
    cost: 1,
    maxLevel: 1
  },
  threshold: {
    id: "threshold",
    name: "Threshold",
    description: "Re-render available at 500k IGM (instead of 1M). Money bonus also starts at 500k.",
    tier: 1,
    cost: 1,
    maxLevel: 1
  },
  foundation: {
    id: "foundation",
    name: "Foundation",
    description: "Triangle, Circle and Cross cost 50% less to unlock.",
    tier: 1,
    cost: 2,
    maxLevel: 1
  },

  // ─── Tier 2 — Resilience ──────────────────────────────────────────────
  anomalyResistance: {
    id: "anomalyResistance",
    name: "Anomaly Resistance",
    description: "Anomaly HP −25%.",
    tier: 2,
    cost: 3,
    maxLevel: 1
  },
  anomalyShielding: {
    id: "anomalyShielding",
    name: "Anomaly Shielding",
    description: "On anomaly defeat, only one currency type can be drained — never the rarest you hold.",
    tier: 2,
    cost: 4,
    maxLevel: 1
  },
  echoOfTheCross: {
    id: "echoOfTheCross",
    name: "Echo of the Cross",
    description: "Cross pattern becomes clickable, with a 10s cooldown between clicks.",
    tier: 2,
    cost: 5,
    maxLevel: 1
  },
  timeDilation: {
    id: "timeDilation",
    name: "Time Dilation",
    description: "Offline cap +50% (multiplies the existing cap).",
    tier: 2,
    cost: 3,
    maxLevel: 1
  },
  stableLoop: {
    id: "stableLoop",
    name: "Stable Loop",
    description: "Re-render keeps 1 random unlocked pattern (other than Square).",
    tier: 2,
    cost: 4,
    maxLevel: 1
  },

  // ─── Tier 3 — Inscription ─────────────────────────────────────────────
  glyphPattern: {
    id: "glyphPattern",
    name: "Glyph Pattern",
    description: "Unlocks the 5th pattern type (Glyph). Producing it generates pending Γ at a slow base rate.",
    tier: 3,
    cost: 8,
    maxLevel: 1
  },
  crossResolution: {
    id: "crossResolution",
    name: "Cross Resolution",
    description: "Reduces Echo of the Cross cooldown. 10s → 7s → 4s → 1s. Stackable.",
    tier: 3,
    cost: 7,
    maxLevel: 3,
    costPerLevel: [7, 8, 10],
    needs: "echoOfTheCross"
  },
  resonance: {
    id: "resonance",
    name: "Resonance",
    description: "Resonances activate at −1 required pattern count. Almost-resonances now fire.",
    tier: 3,
    cost: 7,
    maxLevel: 1
  },
  glyphGenesis: {
    id: "glyphGenesis",
    name: "Glyph Genesis",
    description: "5th pattern Γ generation rate ×2.",
    tier: 3,
    cost: 10,
    maxLevel: 1,
    needs: "glyphPattern"
  },

  // ─── Tier 4 — Recursion ───────────────────────────────────────────────
  recursiveClick: {
    id: "recursiveClick",
    name: "Recursive Click",
    description: "Clicking a thread also fires a click on each adjacent unlocked thread.",
    tier: 4,
    cost: 18,
    maxLevel: 1
  },
  patternMemory: {
    id: "patternMemory",
    name: "Pattern Memory",
    description: "DC upgrades persist through re-render. Only ascension wipes them now.",
    tier: 4,
    cost: 15,
    maxLevel: 1
  },
  engineOverride: {
    id: "engineOverride",
    name: "Engine Override",
    description: "Anomalies appear half as often.",
    tier: 4,
    cost: 20,
    maxLevel: 1
  },
  finalPattern: {
    id: "finalPattern",
    name: "Final Pattern",
    description: "Unlocks the endgame. Producing 1000 Γ patterns triggers the Architect's Choice.",
    tier: 4,
    cost: 25,
    maxLevel: 1,
    needs: "glyphGenesis"
  }
}

// Display order for the tree — keeps tiers grouped and orders within each tier.
export const GLYPH_UPGRADE_ORDER: string[] = [
  "slotV", "bootSequence", "threshold", "foundation",
  "anomalyResistance", "anomalyShielding", "echoOfTheCross", "timeDilation", "stableLoop",
  "glyphPattern", "crossResolution", "resonance", "glyphGenesis",
  "recursiveClick", "patternMemory", "engineOverride", "finalPattern"
]

// Glyph patterns required to trigger the Architect's Choice endgame.
// Tunable — see EXPANSION.md § 6.
export const ENDGAME_GLYPH_PATTERN_THRESHOLD = 1000

export const TIER_NAMES: Record<GlyphUpgradeTier, string> = {
  1: "Foothold",
  2: "Resilience",
  3: "Inscription",
  4: "Recursion"
}

// Tier-1 upgrades the player must own before Tier 2 is buyable.
export const TIER_UNLOCK_REQUIREMENT = 2
