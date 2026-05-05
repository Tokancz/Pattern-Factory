<template>
  <header class="header">
    <div class="brand">
      <div class="brand__mark">PF</div>
      <div>
        <div class="brand__name">{{ user.user?.factoryName || "Pattern Factory" }}</div>
        <div class="brand__sub">{{ user.user?.username || "CTRL · 001" }}</div>
      </div>
    </div>

    <div class="level">
      <div class="level__row">
        <span class="level__num">LVL {{ String(game.level).padStart(2, "0") }}</span>
        <span class="level__session">SESSION {{ sessionTime }}</span>
        <span class="level__cps">+{{ formatNumber(cps) }} / SEC</span>
      </div>
      <div class="level__bar">
        <div class="level__progress">
          <div class="fill" :style="{ width: levelPct + '%' }"></div>
        </div>
        <span class="level__fraction">{{ formatNumber(game.exp) }} / {{ formatNumber(game.expToNextLevel) }}</span>
      </div>
    </div>

    <div class="resources">
      <div class="res res--primary">
        <span class="res__code">IGM</span>
        <span class="res__val">{{ formatNumber(game.money) }}</span>
      </div>
      <div class="res">
        <span class="res__code">DC</span>
        <span class="res__val">{{ formatNumber(game.dc) }}</span>
      </div>
      <div class="res res--gold">
        <span class="res__code">PP</span>
        <span class="res__val">{{ formatNumber(game.prestigePoints) }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue"
import { useGameStore } from "@/stores/game"
import { useUpgradeStore } from "@/stores/upgrade"
import { useUserStore } from "@/stores/user"
import { useSlotStore } from "@/stores/slot"
import { usePatternStore } from "@/stores/pattern"
import { PATTERNS } from "@/data/patterns"
import { formatNumber } from "@/utils/format"

const game = useGameStore()
const upgrades = useUpgradeStore()
const user = useUserStore()
const slots = useSlotStore()
const patterns = usePatternStore()

const levelPct = computed(() => {
  if (!game.expToNextLevel) return 0
  return Math.min(100, (game.exp / game.expToNextLevel) * 100)
})

// rough cps estimate: sum of (speed * value / progress) across active money slots
const cps = computed(() => {
  let total = 0
  for (const s of slots.slots) {
    if (!s.unlocked || !s.patternId) continue
    const p = PATTERNS[s.patternId as keyof typeof PATTERNS]
    if (!p || p.type !== "money") continue
    const speed = slots.getSlotSpeed(s)
    const max = p.baseProgress || 100
    const valuePerCycle = patterns.getPatternValue(s.patternId)
    if (max > 0) total += (speed / max) * valuePerCycle
  }
  return total
})

// session timer
const sessionTime = ref("00:00:00")
const sessionStart = Date.now()
let timerHandle: ReturnType<typeof setInterval> | null = null

function tickSession() {
  const elapsed = Math.floor((Date.now() - sessionStart) / 1000)
  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0")
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0")
  const s = String(elapsed % 60).padStart(2, "0")
  sessionTime.value = `${h}:${m}:${s}`
}

onMounted(() => {
  tickSession()
  timerHandle = setInterval(tickSession, 1000)
})
onUnmounted(() => {
  if (timerHandle) clearInterval(timerHandle)
})
</script>

<style scoped lang="scss">
.header {
  grid-area: header;
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid $border;
  position: relative;
  min-width: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: $s-3;
  padding: $s-4 $s-5;
  border-right: 1px solid $border;
  min-width: $nav-w;

  &__mark {
    width: 32px; height: 32px;
    border-radius: $r-sm;
    background: linear-gradient(135deg, $accent 0%, $purple 100%);
    box-shadow: $glow-cyan;
    display: grid;
    place-items: center;
    color: $bg;
    font-family: $ff-display;
    font-weight: 700;
    font-size: 16px;
  }
  &__name {
    font-family: $ff-display;
    font-weight: 700;
    font-size: 16px;
    letter-spacing: -.01em;
    color: $ink;
  }
  &__sub {
    @include label(10px, $accent);
    margin-top: 2px;
  }
}

.level {
  display: flex;
  flex-direction: column;
  gap: $s-2;
  flex: 1;
  padding: $s-4 $s-6;
  border-right: 1px solid $border;
  min-width: 0;
  justify-content: center;

  &__row {
    display: flex;
    gap: $s-3;
    justify-content: space-between;
    align-items: baseline;
  }
  &__num {
    font-family: $ff-display;
    font-weight: 700;
    font-size: 16px;
    color: $ink;
    @include tab-nums;
  }
  &__session { @include label(10px); }
  &__cps {
    @include label(11px, $success);
    @include tab-nums;
  }
  &__bar {
    display: flex;
    gap: $s-3;
    align-items: center;
  }
  &__progress {
    flex: 1;
    @include progress(8px, $accent);
  }
  &__fraction {
    font-family: $ff-mono;
    font-weight: 700;
    font-size: 12px;
    color: $ink-2;
    @include tab-nums;
    min-width: 80px;
    text-align: right;
  }
}

.resources {
  display: flex;
  align-items: stretch;
}
.res {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  justify-content: center;
  padding: $s-3 $s-5;
  min-width: 96px;
  border-left: 1px solid $border;

  &__code { @include label(10px, $ink-3); }
  &__val {
    font-family: $ff-display;
    font-weight: 700;
    font-size: 22px;
    color: $ink;
    @include tab-nums;
    line-height: 1;
  }

  &--primary &__val { color: $accent; }
  &--gold    &__val { color: $warm; }
}

@media (max-width: 1024px) {
  .header { flex-wrap: wrap; }
  .brand { min-width: 0; flex: 1 1 auto; }
  .level { flex: 1 1 100%; border-right: none; border-top: 1px solid $border; }
  .res { padding: $s-2 $s-4; min-width: 72px; }
  .res__val { font-size: 18px; }
}
</style>
