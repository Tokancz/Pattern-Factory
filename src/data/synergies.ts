export type PatternId = "square" | "triangle" | "circle" | "cross"

export const ALL_PATTERNS: PatternId[] = ["square", "triangle", "circle", "cross"]

export interface SynergyBonus {
  outputMultipliers: Partial<Record<PatternId, number>>
  speedMultipliers:  Partial<Record<PatternId, number>>
}

export type SynergyType = "pair" | "triple" | "full" | "dual" | "dominant"

export interface SynergyDef {
  id:             string
  name:           string
  description:    string
  type:           SynergyType
  // Exact slot composition required to activate. Missing patterns must be absent (count 0).
  requiredCounts: Partial<Record<PatternId, number>>
  minAvgLevel?:   number
  getBonus(levels: Record<PatternId, number>): SynergyBonus
}

export const SYNERGIES: SynergyDef[] = [

  // ── PAIR (2 slots filled, two distinct patterns) ──────────────────────────

  {
    id:          "growth_engine",
    name:        "Growth Engine",
    description: "Money feeds knowledge — both thrive together.",
    type:        "pair",
    requiredCounts: { square: 1, triangle: 1 },
    getBonus: () => ({
      outputMultipliers: { square:   1.10 },
      speedMultipliers:  { triangle: 1.10 }
    })
  },

  {
    id:          "research_lab",
    name:        "Research Lab",
    description: "Knowledge accelerates dark energy discovery.",
    type:        "pair",
    requiredCounts: { triangle: 1, circle: 1 },
    getBonus: () => ({
      outputMultipliers: { circle:   1.12 },
      speedMultipliers:  { triangle: 1.08 }
    })
  },

  {
    id:          "dark_ascension",
    name:        "Dark Ascension",
    description: "Dark energy fuels the ascension process.",
    type:        "pair",
    requiredCounts: { circle: 1, cross: 1 },
    getBonus: () => ({
      outputMultipliers: { circle: 1.10, cross: 1.15 },
      speedMultipliers:  {}
    })
  },

  {
    id:          "legacy_foundation",
    name:        "Legacy Foundation",
    description: "Each prestige run strengthens the foundation.",
    type:        "pair",
    requiredCounts: { square: 1, cross: 1 },
    getBonus: () => ({
      outputMultipliers: { square: 1.15 },
      speedMultipliers:  { cross:  1.08 }
    })
  },

  // ── TRIPLE (3 slots filled, three distinct patterns) ──────────────────────

  {
    id:          "core_triad",
    name:        "Core Triad",
    description: "Money, knowledge, and dark energy form a complete circuit.",
    type:        "triple",
    requiredCounts: { square: 1, triangle: 1, circle: 1 },
    getBonus: () => ({
      outputMultipliers: { square: 1.15, triangle: 1.15, circle: 1.15 },
      speedMultipliers:  { square: 1.08, triangle: 1.08, circle: 1.08 }
    })
  },

  {
    id:          "ascension_path",
    name:        "Ascension Path",
    description: "The three stages of transcendence aligned.",
    type:        "triple",
    requiredCounts: { triangle: 1, circle: 1, cross: 1 },
    getBonus: () => ({
      outputMultipliers: { circle: 1.15, cross: 1.22 },
      speedMultipliers:  { triangle: 1.10 }
    })
  },

  {
    id:          "temporal_mastery",
    name:        "Temporal Mastery",
    description: "Mastery deepens with experience. Scales with average pattern level.",
    type:        "triple",
    requiredCounts: { square: 1, triangle: 1, cross: 1 },
    minAvgLevel: 5,
    getBonus: (levels) => {
      const avg   = (levels.square + levels.triangle + levels.cross) / 3
      const bonus = 1 + avg * 0.04
      return {
        outputMultipliers: { square: bonus, triangle: bonus, cross: bonus },
        speedMultipliers:  {}
      }
    }
  },

  {
    id:          "dark_empire",
    name:        "Dark Empire",
    description: "Material wealth, dark energy, and prestige converge.",
    type:        "triple",
    requiredCounts: { square: 1, circle: 1, cross: 1 },
    getBonus: () => ({
      outputMultipliers: { square: 1.18, circle: 1.15, cross: 1.20 },
      speedMultipliers:  {}
    })
  },

  // ── DUAL (4 slots, 2+2 — two patterns, each doubled) ──────────────────────

  {
    id:          "twin_cores_prosperity",
    name:        "Twin Cores: Prosperity",
    description: "Doubled money and knowledge resonate as twin cores.",
    type:        "dual",
    requiredCounts: { square: 2, triangle: 2 },
    getBonus: () => ({
      outputMultipliers: { square: 1.18, triangle: 1.18 },
      speedMultipliers:  { square: 1.10, triangle: 1.10 }
    })
  },

  {
    id:          "twin_cores_oblivion",
    name:        "Twin Cores: Oblivion",
    description: "Twin dark streams overwhelm the veil.",
    type:        "dual",
    requiredCounts: { circle: 2, cross: 2 },
    getBonus: () => ({
      outputMultipliers: { circle: 1.20, cross: 1.20 },
      speedMultipliers:  {}
    })
  },

  // ── DOMINANT (4 slots, 3+1 — one pattern tripled, one supporting) ─────────

  {
    id:          "dominant_wealth",
    name:        "Dominant: Wealth",
    description: "Triple money lines, reinforced by knowledge.",
    type:        "dominant",
    requiredCounts: { square: 3, triangle: 1 },
    getBonus: () => ({
      outputMultipliers: { square: 1.28 },
      speedMultipliers:  { square: 1.12 }
    })
  },

  {
    id:          "dominant_arcana",
    name:        "Dominant: Arcana",
    description: "A trinity of dark energy, fed by prestige.",
    type:        "dominant",
    requiredCounts: { circle: 3, cross: 1 },
    getBonus: () => ({
      outputMultipliers: { circle: 1.28 },
      speedMultipliers:  { circle: 1.12 }
    })
  },

  // ── FULL (4 slots, 1+1+1+1 — all distinct) ────────────────────────────────

  {
    id:          "perfect_factory",
    name:        "Perfect Factory",
    description: "All forces in harmony. Scales with your weakest pattern level.",
    type:        "full",
    requiredCounts: { square: 1, triangle: 1, circle: 1, cross: 1 },
    getBonus: (levels) => {
      const minLvl  = Math.min(levels.square, levels.triangle, levels.circle, levels.cross)
      const scaling = 1 + minLvl * 0.02
      const out     = 1.25 * scaling
      return {
        outputMultipliers: { square: out, triangle: out, circle: out, cross: out },
        speedMultipliers:  { square: 1.12, triangle: 1.12, circle: 1.12, cross: 1.12 }
      }
    }
  }
]
