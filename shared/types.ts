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