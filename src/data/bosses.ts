import { PATTERNS } from "./patterns"

const BASE = import.meta.env.BASE_URL

export type BossId = keyof typeof PATTERNS

export interface BossTuning {
  clicksRequired: number
  timeLimit: number // seconds
  icon: string
}

export const BOSSES: Record<BossId, BossTuning> = {
  square:   { clicksRequired: 150,  timeLimit: 60, icon: `${BASE}img/patterns/bossSquare.svg` },
  triangle: { clicksRequired: 200, timeLimit: 60, icon: `${BASE}img/patterns/bossTriangle.svg` },
  circle:   { clicksRequired: 250, timeLimit: 60, icon: `${BASE}img/patterns/bossCircle.svg` },
  cross:    { clicksRequired: 300, timeLimit: 60, icon: `${BASE}img/patterns/bossCross.svg` }
}

export const BOSS_MIN_INTERVAL_MS = 3 * 60 * 1000
export const BOSS_MAX_INTERVAL_MS = 6 * 60 * 1000

export const STEAL_LABELS: Record<string, string> = {
  money:    "money",
  exp:      "EXP",
  dc:       "DC",
  prestige: "prestige points"
}
