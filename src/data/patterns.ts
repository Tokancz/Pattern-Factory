const BASE = import.meta.env.BASE_URL

export const PATTERNS = {
  square: {
    baseValue: 1,
    baseProgress: 100,
    type: "money",
    flavour: "Order. Structure. The default render.",
    roleHint: "Generates IGM. Click-friendly.",
    visuals: {
      icon: BASE + "img/patterns/Square.svg",
      slot: BASE + "img/slots/SquareSlot.svg"
    },
    requirements: null
  },
  triangle: {
    baseValue: 2,
    baseProgress: 200,
    type: "exp",
    flavour: "Energy in motion.",
    roleHint: "Generates EXP — fuels the Architect.",
    visuals: {
      icon: `${BASE}img/patterns/Triangle.svg`,
      slot: `${BASE}img/slots/TriangleSlot.svg`
    },
    requirements: {
      money: 100
    }
  },
  circle: {
    baseValue: 1,
    type: "dc",
    baseProgress: 250,
    flavour: "Continuity. Time loops back.",
    roleHint: "Generates DC at a slow base rate.",
    visuals: {
      icon: `${BASE}img/patterns/Circle.svg`,
      slot: `${BASE}img/slots/CircleSlot.svg`
    },
    requirements: {
      level: 15,
      money: 1000
    }
  },
  cross: {
    baseValue: 1,
    type: "prestige",
    baseProgress: 4000,
    flavour: "A paradox. It resolves on its own.",
    roleHint: "Cannot be clicked. Auto-only — generates Pending PP.",
    visuals: {
      icon: `${BASE}img/patterns/Cross.svg`,
      slot: `${BASE}img/slots/CrossSlot.svg`
    },
    requirements: {
      level: 25,
      dc: 500
    }
  },
  // ─── Glyph — the 5th pattern (Reality Engine expansion) ───────────────
  // Hidden from the UI until the Glyph Pattern Glyph upgrade (Tier 3) is
  // owned. Generates pending Glyphs slowly when threaded; intentionally
  // long-tailed so endgame multipliers (overclocks, boosts, machines) are
  // what compresses it into a reasonable cadence — not raw base speed.
  glyph: {
    baseValue: 1,
    type: "glyph",
    baseProgress: 20000,
    flavour: "Your signature in the substrate.",
    roleHint: "Cannot be clicked. Auto-only — generates pending Γ.",
    visuals: {
      icon: `${BASE}img/patterns/Glyph.svg`,
      slot: `${BASE}img/slots/GlyphSlot.svg`
    },
    requirements: null
  }
}