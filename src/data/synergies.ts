export type PatternId = "square" | "triangle" | "circle" | "cross"

export interface SynergyBonus {
  outputMultipliers: Partial<Record<PatternId, number>>
  speedMultipliers:  Partial<Record<PatternId, number>>
}

export interface SynergyDef {
  id:            string
  name:          string
  description:   string
  type:          "pair" | "triple" | "full"
  required:      PatternId[]
  minAvgLevel?:  number
  getBonus(levels: Record<PatternId, number>): SynergyBonus
}

export const SYNERGIES: SynergyDef[] = [

  // ── PAIR ──────────────────────────────────────────────────────────────────

  {
    id:          "growth_engine",
    name:        "Growth Engine",
    description: "Money feeds knowledge — both thrive together.",
    type:        "pair",
    required:    ["square", "triangle"],
    getBonus: () => ({
      outputMultipliers: { square:   1.20 },
      speedMultipliers:  { triangle: 1.20 }
    })
  },

  {
    id:          "research_lab",
    name:        "Research Lab",
    description: "Knowledge accelerates dark energy discovery.",
    type:        "pair",
    required:    ["triangle", "circle"],
    getBonus: () => ({
      outputMultipliers: { circle:   1.25 },
      speedMultipliers:  { triangle: 1.15 }
    })
  },

  {
    id:          "dark_ascension",
    name:        "Dark Ascension",
    description: "Dark energy fuels the ascension process.",
    type:        "pair",
    required:    ["circle", "cross"],
    getBonus: () => ({
      outputMultipliers: { circle: 1.20, cross: 1.35 },
      speedMultipliers:  {}
    })
  },

  {
    id:          "material_exchange",
    name:        "Material Exchange",
    description: "Wealth and dark energy trade resources.",
    type:        "pair",
    required:    ["square", "circle"],
    getBonus: () => ({
      outputMultipliers: { circle: 1.20 },
      speedMultipliers:  { square: 1.20 }
    })
  },

  {
    id:          "knowledge_loop",
    name:        "Knowledge Loop",
    description: "Experience and prestige reinforce each other.",
    type:        "pair",
    required:    ["triangle", "cross"],
    getBonus: () => ({
      outputMultipliers: { triangle: 1.25, cross: 1.25 },
      speedMultipliers:  {}
    })
  },

  {
    id:          "legacy_foundation",
    name:        "Legacy Foundation",
    description: "Each prestige run strengthens the foundation.",
    type:        "pair",
    required:    ["square", "cross"],
    getBonus: () => ({
      outputMultipliers: { square: 1.30 },
      speedMultipliers:  { cross:  1.15 }
    })
  },

  // ── TRIPLE ────────────────────────────────────────────────────────────────

  {
    id:          "core_triad",
    name:        "Core Triad",
    description: "Money, knowledge, and dark energy form a complete circuit.",
    type:        "triple",
    required:    ["square", "triangle", "circle"],
    getBonus: () => ({
      outputMultipliers: { square: 1.30, triangle: 1.30, circle: 1.30 },
      speedMultipliers:  { square: 1.15, triangle: 1.15, circle: 1.15 }
    })
  },

  {
    id:          "ascension_path",
    name:        "Ascension Path",
    description: "The three stages of transcendence aligned.",
    type:        "triple",
    required:    ["triangle", "circle", "cross"],
    getBonus: () => ({
      outputMultipliers: { circle: 1.30, cross: 1.45 },
      speedMultipliers:  { triangle: 1.20 }
    })
  },

  {
    id:          "temporal_mastery",
    name:        "Temporal Mastery",
    description: "Mastery deepens with experience. Scales with average pattern level.",
    type:        "triple",
    required:    ["square", "triangle", "cross"],
    minAvgLevel: 5,
    getBonus: (levels) => {
      const avg   = (levels.square + levels.triangle + levels.cross) / 3
      const bonus = 1 + avg * 0.08
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
    required:    ["square", "circle", "cross"],
    getBonus: () => ({
      outputMultipliers: { square: 1.35, circle: 1.30, cross: 1.40 },
      speedMultipliers:  {}
    })
  },

  // ── FULL ──────────────────────────────────────────────────────────────────

  {
    id:          "perfect_factory",
    name:        "Perfect Factory",
    description: "All forces in harmony. Scales with your weakest pattern level.",
    type:        "full",
    required:    ["square", "triangle", "circle", "cross"],
    getBonus: (levels) => {
      const minLvl  = Math.min(levels.square, levels.triangle, levels.circle, levels.cross)
      const scaling = 1 + minLvl * 0.05
      const out     = 1.60 * scaling
      return {
        outputMultipliers: { square: out, triangle: out, circle: out, cross: out },
        speedMultipliers:  { square: 1.30, triangle: 1.30, circle: 1.30, cross: 1.30 }
      }
    }
  }
]
