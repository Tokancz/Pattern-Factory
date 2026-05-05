<template>
  <aside class="rail">
    <!-- ALMOST THERE -->
    <div class="rail-section">
      <div class="rail-section__head">
        <span class="rail-section__tag">⚑ Almost</span>
        <span class="rail-section__title">there.</span>
      </div>

      <div v-for="row in almostRows" :key="row.label" class="almost">
        <div class="almost__head">
          <span class="almost__label">{{ row.label }}</span>
          <span class="almost__pct">{{ row.pct }}%</span>
        </div>
        <div class="almost__bar">
          <div class="fill" :style="{ width: row.pct + '%' }"></div>
        </div>
        <div class="almost__foot">
          <span class="almost__sub">{{ row.sub }}</span>
        </div>
      </div>

      <div v-if="almostRows.length === 0" class="empty">No goals nearby.</div>
    </div>

    <!-- LIVE FEED -->
    <div class="rail-section rail-section--feed">
      <div class="rail-section__head">
        <span class="rail-section__tag">⏱ Live</span>
        <span class="rail-section__title">feed.</span>
      </div>
      <div class="feed">
        <div
          v-for="line in feedLines"
          :key="line.id"
          class="feed__line"
        >
          <span class="feed__t">{{ line.t }}</span>
          <span class="feed__x" :class="line.cls">{{ line.text }}</span>
          <span v-if="line.tag" class="feed__tag">{{ line.tag }}</span>
        </div>
        <div v-if="feedLines.length === 0" class="empty">…awaiting events</div>
      </div>
    </div>

    <!-- BOSS CARD -->
    <div class="boss-card" :class="{ 'is-warn': bossPhase === 'warn', 'is-imminent': bossPhase === 'imminent' }">
      <img class="boss-card__art" :src="bossArt" alt="" aria-hidden="true">
      <div class="boss-card__head">
        <span class="a">BOSS</span>
        <span class="b">{{ bossWord }}</span>
      </div>
      <div class="boss-card__meta">
        <span class="boss-card__name">{{ bossName.toUpperCase() }} BOSS</span>
        <span class="boss-card__time">{{ countdownLabel }}</span>
      </div>
      <div class="boss-card__warn">defeat or lose all {{ stealResource }}</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useGameStore } from "@/stores/game"
import { useUpgradeStore } from "@/stores/upgrade"
import { usePatternStore } from "@/stores/pattern"
import { useBossStore } from "@/stores/boss"
import { PATTERNS } from "@/data/patterns"
import { BOSSES } from "@/data/bosses"
import { formatNumber } from "@/utils/format"

const game = useGameStore()
const upgrades = useUpgradeStore()
const patterns = usePatternStore()
const boss = useBossStore()

// ── ALMOST THERE ──
const almostRows = computed(() => {
  const rows: { label: string; pct: number; sub: string }[] = []

  // pattern unlocks
  for (const id of Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]) {
    if (patterns.unlockedPatterns.includes(id)) continue
    const def = PATTERNS[id]
    if (!def.requirements) continue
    let pct = 100
    let sub = ""
    if ("money" in def.requirements && def.requirements.money) {
      const have = game.money
      const need = def.requirements.money
      pct = Math.min(100, Math.floor((have / need) * 100))
      sub = `${formatNumber(Math.max(0, need - have))} IGM to buy`
    } else if ("dc" in def.requirements && def.requirements.dc) {
      const have = game.dc
      const need = def.requirements.dc
      pct = Math.min(100, Math.floor((have / need) * 100))
      sub = `${formatNumber(Math.max(0, need - have))} DC to buy`
    } else if ("level" in def.requirements && def.requirements.level) {
      const have = game.level
      const need = def.requirements.level
      pct = Math.min(100, Math.floor((have / need) * 100))
      sub = `${Math.max(0, need - have)} levels left`
    }
    rows.push({ label: `${id.charAt(0).toUpperCase() + id.slice(1)} unlock`, pct, sub })
  }

  // level progress (always shown)
  const lvlPct = Math.min(100, Math.floor((game.exp / Math.max(1, game.expToNextLevel)) * 100))
  rows.push({
    label: `Level ${game.level + 1}`,
    pct: lvlPct,
    sub: `${formatNumber(Math.max(0, game.expToNextLevel - game.exp))} exp left`
  })

  return rows.slice(0, 3)
})

// ── LIVE FEED ──
type FeedLine = { id: number; t: string; text: string; cls: string; tag?: string }
const feedLines = ref<FeedLine[]>([])
let feedId = 0
const sessionStart = Date.now()

function pushFeed(text: string, cls = "feed__x--gain", tag?: string) {
  const elapsed = Math.floor((Date.now() - sessionStart) / 1000)
  const m = String(Math.floor(elapsed / 60)).padStart(1, "0")
  const s = String(elapsed % 60).padStart(2, "0")
  feedLines.value.unshift({ id: feedId++, t: `${m}:${s}`, text, cls, tag })
  if (feedLines.value.length > 10) feedLines.value.pop()
}

// watch money / level changes to push feed events
let lastMoney = game.money
let lastLevel = game.level
let lastDc = game.dc
let lastBossId = boss.activeBossId

const tickHandle = ref<ReturnType<typeof setInterval> | null>(null)
onMounted(() => {
  pushFeed("▶ SESSION START", "feed__x--start")
  tickHandle.value = setInterval(() => {
    const dm = game.money - lastMoney
    if (dm > 0.01) {
      pushFeed(`+${formatNumber(dm)} IGM`, "feed__x--gain")
    }
    lastMoney = game.money

    if (game.level > lastLevel) {
      pushFeed(`LVL UP → ${game.level}`, "feed__x--combo", "★")
      lastLevel = game.level
    }
    const dc = game.dc - lastDc
    if (dc > 0) {
      pushFeed(`+${formatNumber(dc)} DC`, "feed__x--gain")
      lastDc = game.dc
    }
  }, 1500)
})
onUnmounted(() => {
  if (tickHandle.value) clearInterval(tickHandle.value)
})

watch(() => boss.lastResult, (result) => {
  if (result === "victory") pushFeed("BOSS DEFEATED", "feed__x--combo", "WIN")
  if (result === "defeat") pushFeed("BOSS DEFEAT", "feed__x--combo", "LOSE")
})
watch(() => boss.activeBossId, (id) => {
  if (id && id !== lastBossId) pushFeed(`BOSS APPEARED · ${id}`, "feed__x--combo", "!")
  lastBossId = id
})

// ── BOSS CARD ──
const bossName = computed(() => boss.activeBossId ?? "incoming")
const bossArt = computed(() => {
  const id = boss.activeBossId ?? "square"
  return `/img/patterns/boss${id.charAt(0).toUpperCase()}${id.slice(1)}.svg`
})
const stealResource = computed(() => {
  if (!boss.activePattern) return "IGM"
  const t = boss.activePattern.type
  if (t === "money") return "IGM"
  if (t === "dc") return "DC"
  if (t === "exp") return "EXP"
  return "PP"
})

const countdownLabel = computed(() => {
  if (boss.activeBossId) {
    const t = Math.max(0, boss.timeLeft)
    return formatTime(t)
  }
  // shows the spawn-delay countdown
  const sec = Math.max(0, Math.ceil(boss.nextSpawnDelayMs / 1000))
  return formatTime(sec)
})

const bossPhase = computed<"idle" | "warn" | "imminent">(() => {
  if (boss.activeBossId) {
    const pct = boss.timeLeft / Math.max(1, boss.timeLimit)
    if (pct < 0.4) return "imminent"
    if (pct < 0.7) return "warn"
    return "idle"
  }
  const sec = Math.ceil(boss.nextSpawnDelayMs / 1000)
  if (sec <= 3) return "imminent"
  if (sec <= 8) return "warn"
  return "idle"
})

const bossWord = computed(() => {
  if (boss.activeBossId) return "active"
  if (bossPhase.value === "imminent") return "imminent"
  if (bossPhase.value === "warn") return "approach"
  return "incoming"
})

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const r = Math.floor(s % 60)
  return `${m}:${String(r).padStart(2, "0")}`
}
</script>

<style scoped lang="scss">
.rail {
  grid-area: aside;
  border-left: 1px solid $border;
  background: rgba($surface, .25);
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.rail-section {
  padding: $s-4 $s-5;
  border-bottom: 1px solid $border;
  &--feed { flex: 1; min-height: 0; overflow: hidden; }

  &__head {
    display: flex;
    align-items: center;
    gap: $s-2;
    margin-bottom: $s-3;
  }
  &__tag { @include chip; }
  &__title {
    font-family: $ff-display;
    font-weight: 600;
    font-size: 16px;
    color: $ink;
    letter-spacing: -.01em;
  }
}
.empty {
  font-size: 12px;
  color: $ink-3;
  font-style: italic;
}

// almost rows
.almost {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: $s-4;
  &:last-child { margin-bottom: 0; }

  &__head { display: flex; gap: $s-3; justify-content: space-between; align-items: baseline; }
  &__label {
    font-family: $ff-ui;
    font-weight: 500;
    font-size: 13px;
    color: $ink;
  }
  &__pct {
    font-family: $ff-mono;
    font-weight: 700;
    font-size: 11px;
    color: $ink-2;
    @include tab-nums;
  }
  &__bar { @include progress(4px); margin: 4px 0 6px; }
  &__sub { font-size: 11px; color: $ink-3; }
}

// feed
.feed {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-family: $ff-mono;
  font-size: 12px;
  max-height: 100%;
  overflow: hidden;

  &__line {
    display: flex;
    gap: $s-2;
    align-items: baseline;
    padding: 3px 0;
  }
  &__t {
    color: $ink-4;
    min-width: 36px;
    font-weight: 600;
    @include tab-nums;
  }
  &__x { color: $ink-2; flex: 1; @include tab-nums; }
  &__x--gain { color: $success; }
  &__x--combo { color: $warm; font-weight: 700; }
  &__x--start { color: $ink; font-weight: 700; }
  &__tag {
    @include chip($warm, rgba($warm, .15));
    font-size: 9px;
    padding: 1px 5px;
  }
}

// boss card
.boss-card {
  position: relative;
  padding: $s-4 $s-5;
  background:
    radial-gradient(ellipse 70% 80% at 100% 100%, rgba($danger, .25) 0%, transparent 70%),
    linear-gradient(180deg, #1B0F2E 0%, #14091F 100%);
  overflow: hidden;
  isolation: isolate;
  transition: background .25s $ease, box-shadow .25s $ease;

  &::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 6px;
    background: repeating-linear-gradient(45deg, $accent 0 8px, transparent 8px 16px);
    opacity: .5;
    transition: background .25s $ease;
  }

  &__art {
    position: absolute;
    right: -8px; bottom: -10px;
    width: 130px;
    opacity: .8;
    filter: drop-shadow(0 0 18px rgba($danger, .35));
    pointer-events: none;
    z-index: 0;
  }
  &__head {
    display: flex;
    align-items: baseline;
    gap: $s-2;
    position: relative;
    z-index: 1;
    .a {
      font-family: $ff-display;
      font-weight: 700;
      font-size: 22px;
      color: $accent;
      letter-spacing: -.01em;
      transition: color .2s $ease;
    }
    .b {
      font-family: $ff-display;
      font-weight: 600;
      font-size: 22px;
      color: rgba($ink, .35);
      letter-spacing: -.01em;
      text-transform: lowercase;
    }
  }
  &__meta {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 6px;
    position: relative;
    z-index: 1;
  }
  &__name {
    @include label(11px, $ink-2);
    letter-spacing: .14em;
  }
  &__time {
    font-family: $ff-display;
    font-weight: 700;
    font-size: 22px;
    color: $accent;
    @include tab-nums;
    transition: color .2s $ease;
  }
  &__warn {
    @include label(10px, $ink-3);
    margin-top: 6px;
    position: relative;
    z-index: 1;
  }

  &.is-warn {
    background:
      radial-gradient(ellipse 70% 80% at 100% 100%, rgba($warm, .35) 0%, transparent 70%),
      linear-gradient(180deg, #2A1A0F 0%, #1A0E07 100%);
    .boss-card__head .a { color: $warm; }
    .boss-card__time   { color: $warm; }
  }
  &.is-imminent {
    animation: bossCardPulse .55s ease-in-out infinite alternate;
    &::before {
      background: repeating-linear-gradient(45deg, $danger 0 8px, $bg 8px 16px);
      animation: stripeSlide .35s linear infinite;
    }
    .boss-card__head .a { color: $danger; }
    .boss-card__time   { color: $danger; animation: tickPop .5s ease-in-out infinite; }
  }
}
@keyframes bossCardPulse {
  from { box-shadow: 0 0 0 1px rgba($danger, .25), 0 0 0 rgba($danger, 0) inset; }
  to   { box-shadow: 0 0 0 1px rgba($danger, .8),  0 0 24px rgba($danger, .55) inset; }
}
@keyframes stripeSlide { from { background-position: 0 0; } to { background-position: 32px 0; } }
@keyframes tickPop {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.18); }
}
</style>
