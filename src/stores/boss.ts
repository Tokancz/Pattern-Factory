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
type BossPhase = "idle" | "incoming" | "active"

// Total duration of the pre-fight countdown in seconds. The countdown
// labels ("3", "2", "1", "FIGHT") are derived from `preludeLeft` in the
// component — see BossFight.vue::countdownLabel.
const PRELUDE_SECONDS = 3.5

let tickHandle: ReturnType<typeof setInterval> | null = null

function randomSpawnDelay(): number {
  const span = BOSS_MAX_INTERVAL_MS - BOSS_MIN_INTERVAL_MS
  return BOSS_MIN_INTERVAL_MS + Math.random() * span
}

export const useBossStore = defineStore("boss", {
  state: () => ({
    activeBossId: null as BossId | null,
    phase: "idle" as BossPhase,
    preludeLeft: 0,
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

    isActive: (state) => state.phase !== "idle",

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

      if (this.phase === "incoming") {
        this.preludeLeft -= deltaMs / 1000
        if (this.preludeLeft <= 0) this.engage()
      } else if (this.phase === "active") {
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

      const id = available[Math.floor(Math.random() * available.length)]!
      this.activeBossId = id
      this.phase = "incoming"
      this.preludeLeft = PRELUDE_SECONDS
      this.clicks = 0
      this.timeLeft = 0
      this.lastResult = null
      playSound("countdown")
      startBossLoop()
    },

    engage() {
      if (!this.activeBossId) return
      this.phase = "active"
      this.preludeLeft = 0
      this.timeLeft = BOSSES[this.activeBossId].timeLimit
      playSound("fight")
    },

    registerClick() {
      if (this.phase !== "active" || !this.activeBossId) return
      this.clicks++
      // Random pitch so each hit sounds slightly different (±a couple
      // semitones via playbackRate).
      const rate = 0.85 + Math.random() * 0.35
      playSound("hit", { rate })
      if (this.clicks >= BOSSES[this.activeBossId].clicksRequired) {
        this.victory()
      }
    },

    victory() {
      this.activeBossId = null
      this.phase = "idle"
      this.preludeLeft = 0
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
        case "prestige": game.pendingPrestigePoints = 0; break
        case "exp":      game.exp = 0; break
      }

      this.activeBossId = null
      this.phase = "idle"
      this.preludeLeft = 0
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
