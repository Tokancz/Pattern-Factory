import { PATTERNS } from "@/data/patterns"

// Snapshot of the game state an achievement condition can read. Built once
// per check in the achievement store so the predicates stay pure and the
// data layer never imports stores (avoids a circular dependency).
export interface AchievementContext {
  money:                number
  dc:                   number
  level:                number
  prestigePoints:       number
  ascensionCount:       number
  glyphs:               number
  unlockedSlots:        number
  unlockedPatternCount: number
  totalPatternCount:    number
  maxPatternLevel:      number
}

export interface AchievementDef {
  id:          string
  name:        string
  description: string
  icon:        string // Font Awesome class (matches the rest of the UI)
  check:       (c: AchievementContext) => boolean
}

const TOTAL_PATTERNS = Object.keys(PATTERNS).length

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Unlock a second pattern.",
    icon: "fa-solid fa-shoe-prints",
    check: c => c.unlockedPatternCount >= 2
  },
  {
    id: "full-spectrum",
    name: "Full Spectrum",
    description: "Unlock every pattern.",
    icon: "fa-solid fa-shapes",
    check: c => c.unlockedPatternCount >= TOTAL_PATTERNS
  },
  {
    id: "refined",
    name: "Refined",
    description: "Raise any pattern to level 10.",
    icon: "fa-solid fa-star",
    check: c => c.maxPatternLevel >= 10
  },
  {
    id: "level-10",
    name: "Getting Warmed Up",
    description: "Reach level 10.",
    icon: "fa-solid fa-arrow-up",
    check: c => c.level >= 10
  },
  {
    id: "level-25",
    name: "Seasoned Operator",
    description: "Reach level 25.",
    icon: "fa-solid fa-arrow-trend-up",
    check: c => c.level >= 25
  },
  {
    id: "level-50",
    name: "Master Architect",
    description: "Reach level 50.",
    icon: "fa-solid fa-crown",
    check: c => c.level >= 50
  },
  {
    id: "capital-surplus",
    name: "Capital Surplus",
    description: "Hold 1,000,000 at once.",
    icon: "fa-solid fa-coins",
    check: c => c.money >= 1_000_000
  },
  {
    id: "industrial-tycoon",
    name: "Industrial Tycoon",
    description: "Hold 1,000,000,000 at once.",
    icon: "fa-solid fa-sack-dollar",
    check: c => c.money >= 1_000_000_000
  },
  {
    id: "data-cache",
    name: "Data Cache",
    description: "Hold 10,000 DC.",
    icon: "fa-solid fa-database",
    check: c => c.dc >= 10_000
  },
  {
    id: "all-threads",
    name: "All Threads",
    description: "Unlock all 5 production slots.",
    icon: "fa-solid fa-layer-group",
    check: c => c.unlockedSlots >= 5
  },
  {
    id: "recursion",
    name: "Recursion",
    description: "Earn your first Prestige Point.",
    icon: "fa-solid fa-rotate",
    check: c => c.prestigePoints >= 1
  },
  {
    id: "loop-veteran",
    name: "Loop Veteran",
    description: "Accumulate 100 Prestige Points.",
    icon: "fa-solid fa-rotate-right",
    check: c => c.prestigePoints >= 100
  },
  {
    id: "reality-engine",
    name: "Reality Engine",
    description: "Ascend for the first time.",
    icon: "fa-solid fa-up-long",
    check: c => c.ascensionCount >= 1
  },
  {
    id: "glyph-bearer",
    name: "Glyph Bearer",
    description: "Bank your first Glyph.",
    icon: "fa-solid fa-wand-magic-sparkles",
    check: c => c.glyphs >= 1
  }
]
