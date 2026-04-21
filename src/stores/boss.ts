import { defineStore } from "pinia"
import { PATTERNS } from "@/data/patterns"
import {
  BOSSES,
  BOSS_MIN_INTERVAL_MS,
  BOSS_MAX_INTERVAL_MS
} from "@/data/bosses"
import type { BossId } from "@/data/bosses"
import { usePatternStore } from "./pattern"
import { useGameStore } from "./game"
import { playSound, startBossLoop, stopBossLoop } from "@/utils/sound"

type BossResult = "victory" | "defeat" | null

let tickHandle: ReturnType<typeof setInterval> | null = null

function randomSpawnDelay(): number {
  const span = BOSS_MAX_INTERVAL_MS - BOSS_MIN_INTERVAL_MS
  return BOSS_MIN_INTERVAL_MS + Math.random() * span
}

export const useBossStore = defineStore("boss", {
  state: () => ({
    activeBossId: null as BossId | null,
    clicks: 0,
    timeLeft: 0,
    lastResult: null as BossResult,
    nextSpawnDelayMs: randomSpawnDelay()
  }),

  getters: {
    activePattern: (state) =>
      state.activeBossId ? PATTERNS[state.activeBossId] : null,

    activeTuning: (state) =>
      state.activeBossId ? BOSSES[state.activeBossId] : null,

    isActive: (state) => state.activeBossId !== null,

    clicksRequired(): number {
      return this.activeTuning?.clicksRequired ?? 0
    },

    timeLimit(): number {
      return this.activeTuning?.timeLimit ?? 0
    },

    stealType(): string {
      return this.activePattern?.type ?? ""
    }
  },

  actions: {
    start() {
      if (tickHandle !== null) return
      tickHandle = setInterval(() => this.tick(100), 100)
    },

    tick(deltaMs: number) {
      // AFK-safe: only tick while the tab is visible
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return

      if (this.activeBossId) {
        this.timeLeft -= deltaMs / 1000
        if (this.timeLeft <= 0) this.fail()
      } else {
        this.nextSpawnDelayMs -= deltaMs
        if (this.nextSpawnDelayMs <= 0) this.spawn()
      }
    },

    spawn() {
      const patterns = usePatternStore()
      const available = patterns.unlockedPatterns.filter(
        (id): id is BossId => id in BOSSES
      )

      if (available.length === 0) {
        this.nextSpawnDelayMs = randomSpawnDelay()
        return
      }

      const id = available[Math.floor(Math.random() * available.length)]
      this.activeBossId = id
      this.clicks = 0
      this.timeLeft = BOSSES[id].timeLimit
      this.lastResult = null
      playSound("magic")
      startBossLoop()
    },

    registerClick() {
      if (!this.activeBossId) return
      this.clicks++
      playSound("hit")
      if (this.clicks >= BOSSES[this.activeBossId].clicksRequired) {
        this.victory()
      }
    },

    victory() {
      this.activeBossId = null
      this.lastResult = "victory"
      this.nextSpawnDelayMs = randomSpawnDelay()
      stopBossLoop()
      playSound("victory")
      this.scheduleResultClear()
    },

    fail() {
      const pattern = this.activePattern
      if (!pattern) return

      const game = useGameStore()
      switch (pattern.type) {
        case "money":    game.money = 0; break
        case "dc":       game.dc = 0; break
        case "prestige": game.prestigePoints = 0; break
        case "exp":      game.exp = 0; break
      }

      this.activeBossId = null
      this.lastResult = "defeat"
      this.nextSpawnDelayMs = randomSpawnDelay()
      stopBossLoop()
      playSound("defeat")
      this.scheduleResultClear()
    },

    scheduleResultClear() {
      const marker = this.lastResult
      setTimeout(() => {
        if (this.lastResult === marker) this.lastResult = null
      }, 2500)
    }
  }
})
