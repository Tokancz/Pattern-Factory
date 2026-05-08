// Shared between frontend (src/) and backend (server/src/)

export interface User {
  id: number
  username: string
  email: string
  factoryName: string
  createdAt: string
}

export interface SlotStatePayload {
  slotIndex: number
  patternId: string | null
  progress: number
  unlocked: boolean
  speedMultiplier: number
  outputMultiplier: number
}

export interface Slot {
  id: number
  patternId: string | null
  progress: number
  unlocked: boolean
  speedMultiplier: number
  outputMultiplier: number
}

export interface UpgradeLevelPayload {
  upgradeId: string
  level: number
  upgradeType: "normal" | "dc" | "prestige"
}

export interface MachineLevelPayload {
  machineId: string
  level: number
}

export interface PatternProgressPayload {
  patternId: string
  level: number
  exp: number
  unlocked: boolean
}

export interface GlyphUpgradeLevelPayload {
  upgradeId: string
  level: number
}

export interface SavePayload {
  money: number
  dc: number
  prestigePoints: number
  pendingPrestigePoints: number
  level: number
  exp: number
  unlockedSlots: number
  lastPlayed: number
  saveVersion: number
  slots: SlotStatePayload[]
  upgrades: UpgradeLevelPayload[]
  machines: MachineLevelPayload[]
  patterns: PatternProgressPayload[]

  // Reality Engine expansion. Optional on the wire so an older client
  // (without Glyph state) can still PUT a save against the new server
  // without sending these. Missing fields are treated as defaults.
  glyphs?:            number
  pendingGlyphs?:     number
  ascensionCount?:    number
  glyphPatternCount?: number
  endgameState?:      "stabilized" | null
  seenIntro?:         boolean
  glyphUpgrades?:     GlyphUpgradeLevelPayload[]
}

export interface LeaderboardEntry {
  rank: number
  id: number
  userId: number
  username: string
  factoryName: string
  prestigePoints: number
  money: number
  level: number
  submittedAt: string
}

export interface MyRankData {
  rank: number
  money: number
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiError {
  error: string
  details?: string
}