import { PATTERNS } from "./patterns"

export type BossId = keyof typeof PATTERNS

export interface BossTuning {
  clicksRequired: number
  timeLimit: number // seconds
}

export const BOSSES: Record<BossId, BossTuning> = {
  square:   { clicksRequired: 80,  timeLimit: 60 },
  triangle: { clicksRequired: 120, timeLimit: 60 },
  circle:   { clicksRequired: 150, timeLimit: 60 },
  cross:    { clicksRequired: 200, timeLimit: 60 }
}

export const BOSS_MIN_INTERVAL_MS = 6000//3 * 60 * 1000
export const BOSS_MAX_INTERVAL_MS = 10000//10 * 60 * 1000

export const STEAL_LABELS: Record<string, string> = {
  money:    "money",
  exp:      "EXP",
  dc:       "DC",
  prestige: "prestige points"
}
