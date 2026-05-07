<template>
  <Transition name="boss-takeover-fade">
    <div
      v-if="boss.isActive"
      class="boss-takeover"
      :class="{ shake: spawning }"
      role="dialog"
      aria-modal="true"
    >
      <div class="bt-vignette" aria-hidden="true"></div>
      <div class="bt-hazard top" aria-hidden="true"></div>
      <div class="bt-hazard bot" aria-hidden="true"></div>
      <div class="bt-scanlines" aria-hidden="true"></div>

      <div class="bt-corner tl">▌ ENC-{{ encNum }}</div>
      <div class="bt-corner tr">SECTOR · 01</div>
      <div class="bt-corner bl">THREAT · A</div>
      <div class="bt-corner br">⚠ DEFEND</div>

      <!-- Countdown stage: shown during the pre-fight prelude -->
      <div v-if="boss.phase === 'incoming'" class="bt-countdown">
        <div class="bt-count-tag">⚠ INCOMING ⚠</div>
        <div
          class="bt-count-num"
          :class="{ go: countdownLabel === 'FIGHT', tick: ticking }"
        >
          {{ countdownLabel }}
        </div>
        <div class="bt-count-sub">{{ bossName.toUpperCase() }} ANOMALY APPROACHING</div>
      </div>

      <!-- Active anomaly stage -->
      <div v-else class="bt-boss-stage">
        <div class="bt-boss-head">
          <div class="bt-boss-tag">⚠ ANOMALY DETECTED</div>
          <div class="bt-boss-meta-mini">
            LVL.{{ game.level }} · TIMER {{ boss.timeLeft.toFixed(1) }}s
          </div>
        </div>

        <div class="bt-boss-body">
          <button
            type="button"
            class="bt-boss-art-wrap"
            @click.stop="onHit"
            :aria-label="`Resolve ${bossName} anomaly`"
          >
            <img
              class="bt-boss-art"
              :class="hitShakeClass"
              :src="bossIcon"
              alt=""
              draggable="false"
            />
          </button>
        </div>

        <div class="bt-boss-foot">
          <div class="bt-boss-title-row">
            <div class="bt-boss-title">
              <span class="accent">{{ bossName.toUpperCase() }}</span> ANOMALY
            </div>
          </div>
          <div class="bt-hp-row">
            <span class="bt-hp-label">HP</span>
            <div class="bt-hp-bar">
              <div class="fill" :style="{ width: hpPercent + '%' }"></div>
              <div class="ticks" aria-hidden="true">
                <span v-for="i in 10" :key="i"></span>
              </div>
            </div>
            <span class="bt-hp-num">{{ remainingClicks }} / {{ boss.clicksRequired }}</span>
          </div>
          <div class="bt-actions">
            <div class="bt-timer-bar" aria-hidden="true">
              <div class="bt-timer-fill" :style="{ width: timerPercent + '%' }"></div>
              <span>{{ boss.timeLeft.toFixed(1) }}s</span>
            </div>
            <div class="bt-reward">
              PENALTY: <span class="pen">−ALL {{ stealLabel.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Cursor hitmarks — spawned at click position on each registered hit -->
  <div class="bt-hitmark-layer" aria-hidden="true">
    <div
      v-for="hm in hitmarks"
      :key="hm.id"
      class="bt-hitmark"
      :style="{
        left: hm.x + 'px',
        top: hm.y + 'px',
        '--rot': hm.rot + 'deg',
        '--size': hm.size + 'px',
      }"
    >×</div>
  </div>

  <Transition name="boss-result-fade">
    <div
      v-if="boss.lastResult"
      class="boss-result"
      :class="boss.lastResult"
      aria-live="polite"
    >
      <p>
        {{ boss.lastResult === 'victory' ? 'VICTORY' : 'DEFEATED' }}
      </p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useBossStore } from "@/stores/boss"
import { useGameStore } from "@/stores/game"
import { STEAL_LABELS } from "@/data/bosses"

const boss = useBossStore()
const game = useGameStore()

// Encounter counter — increments each spawn for the corner stamp.
const encCount = ref(1)
const encNum = computed(() => String(encCount.value).padStart(3, "0"))

// `spawning` triggers the entry-shake animation for ~600ms after activation.
const spawning = ref(false)
let spawnTimer: ReturnType<typeof setTimeout> | null = null

watch(
  () => boss.isActive,
  (active, wasActive) => {
    if (active && !wasActive) {
      spawning.value = true
      encCount.value++
      if (spawnTimer) clearTimeout(spawnTimer)
      spawnTimer = setTimeout(() => { spawning.value = false }, 600)
    }
  }
)

const bossName = computed(() => {
  if (!boss.activeBossId) return ""
  return boss.activeBossId.charAt(0).toUpperCase() + boss.activeBossId.slice(1)
})

const bossIcon = computed(() => boss.activeTuning?.icon ?? "")

const stealLabel = computed(() => STEAL_LABELS[boss.stealType] ?? boss.stealType)

// Countdown label derived from boss.preludeLeft. Each whole second shows
// the next number, the final ~0.5s flips to "FIGHT". The label is a
// stable string so the persistent <div> can stay mounted — we just
// flash a brief tick animation on each change.
const countdownLabel = computed(() => {
  const t = boss.preludeLeft
  if (t > 2.5) return "3"
  if (t > 1.5) return "2"
  if (t > 0.5) return "1"
  return "FIGHT"
})

// `ticking` is toggled briefly each time the countdown label changes so
// the CSS .tick animation re-fires (cleared across two RAFs to restart).
const ticking = ref(false)
let tickTimer: ReturnType<typeof setTimeout> | null = null
watch(countdownLabel, () => {
  ticking.value = false
  if (tickTimer) clearTimeout(tickTimer)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    ticking.value = true
    tickTimer = setTimeout(() => { ticking.value = false }, 360)
  }))
})

// Hit shake: pick one of four keyframe variants per click so the boss
// jerks in different directions instead of replaying the same shake.
const SHAKE_VARIANTS = 4
const hitShakeVariant = ref<number | null>(null)
let hitShakeTimer: ReturnType<typeof setTimeout> | null = null
const hitShakeClass = computed(() =>
  hitShakeVariant.value ? `hit-shake-${hitShakeVariant.value}` : ""
)

// Cursor hitmarks — each click spawns an X at viewport coords with a
// random rotation and size, then auto-removes after the animation runs.
interface Hitmark { id: number; x: number; y: number; rot: number; size: number }
const hitmarks = ref<Hitmark[]>([])
let hitmarkId = 0

function spawnHitmark(e: MouseEvent) {
  const id = ++hitmarkId
  const rot = Math.random() * 40 - 20
  const size = 56 + Math.floor(Math.random() * 32)
  hitmarks.value.push({ id, x: e.clientX, y: e.clientY, rot, size })
  setTimeout(() => {
    hitmarks.value = hitmarks.value.filter(h => h.id !== id)
  }, 600)
}

function onHit(e: MouseEvent) {
  boss.registerClick()
  spawnHitmark(e)

  hitShakeVariant.value = null
  if (hitShakeTimer) clearTimeout(hitShakeTimer)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    hitShakeVariant.value = 1 + Math.floor(Math.random() * SHAKE_VARIANTS)
    hitShakeTimer = setTimeout(() => { hitShakeVariant.value = null }, 200)
  }))
}

const remainingClicks = computed(() =>
  Math.max(0, boss.clicksRequired - boss.clicks)
)

const hpPercent = computed(() => {
  if (boss.clicksRequired === 0) return 0
  return Math.max(0, (1 - boss.clicks / boss.clicksRequired) * 100)
})

const timerPercent = computed(() => {
  if (boss.timeLimit === 0) return 0
  return Math.max(0, (boss.timeLeft / boss.timeLimit) * 100)
})
</script>

<style scoped lang="scss">
$boss-red: #FF3B1A;
$boss-red-dark: #A8230E;

.boss-takeover {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: grid;
  place-items: center;
  overflow: hidden;
  pointer-events: auto;
}

/* Dimmed red vignette */
.bt-vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center,
      rgba(0, 0, 0, 0.55) 0%,
      rgba(40, 0, 0, 0.92) 70%,
      rgba(80, 0, 10, 0.97) 100%);
}

/* Subtle CRT scanlines */
.bt-scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    rgba(255, 255, 255, 0.04) 0 1px,
    transparent 1px 4px
  );
  mix-blend-mode: overlay;
}

/* Hazard stripes top + bottom, animated diagonal slide */
.bt-hazard {
  position: absolute;
  left: 0;
  right: 0;
  height: 18px;
  background: repeating-linear-gradient(
    45deg,
    $boss-red 0 18px,
    var(--black) 18px 36px
  );
  animation: hazardIn 0.3s ease-out forwards, hazardSlide 0.6s linear infinite;

  &.top { top: 0; transform-origin: top; }
  &.bot { bottom: 0; transform-origin: bottom; }
}
@keyframes hazardIn {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}
@keyframes hazardSlide {
  from { background-position: 0 0; }
  to   { background-position: 72px 0; }
}

/* Corner stamps */
.bt-corner {
  position: absolute;
  font-family: "KHInterference", monospace;
  font-weight: bold;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: rgba(255, 255, 255, 0.45);

  &.tl { top: 30px; left: 30px; }
  &.tr { top: 30px; right: 30px; }
  &.bl { bottom: 30px; left: 30px; }
  &.br { bottom: 30px; right: 30px; }
}

/* Reveal stage layout */
.bt-boss-stage {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 64px 60px;
  gap: 18px;
  animation: bossStageIn 0.35s ease-out;

  @include bp-below("lg") { padding: 56px 24px; }
  @include bp("sm")       { padding: 48px 14px; gap: 12px; }
}
@keyframes bossStageIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: none; }
}

.bt-boss-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}
.bt-boss-tag {
  background: $boss-red;
  color: var(--white);
  padding: 6px 14px;
  font-family: "KHInterference", monospace;
  font-weight: bold;
  font-size: 13px;
  letter-spacing: 0.2em;
  border: 3px solid var(--black);
}
.bt-boss-meta-mini {
  font-family: "KHInterference", monospace;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.18em;
  color: rgba(255, 255, 255, 0.7);
  font-variant-numeric: tabular-nums;
}

.bt-boss-body {
  position: relative;
  display: grid;
  place-items: center;
}
.bt-boss-art-wrap {
  position: relative;
  width: 380px;
  height: 300px;
  max-width: 100%;
  display: grid;
  place-items: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  user-select: none;
  animation: bossFloat 2.4s ease-in-out infinite;
  transition: transform 0.06s ease;

  @include bp-below("lg") { width: 260px; height: 220px; }
  @include bp("sm")       { width: 200px; height: 180px; }

  &::before {
    content: "";
    position: absolute;
    inset: -20px;
    background: radial-gradient(circle, rgba(255, 59, 26, 0.45) 0%, transparent 65%);
    filter: blur(20px);
    animation: bossGlow 1.4s ease-in-out infinite alternate;
    pointer-events: none;
  }

  &:active {
    transform: scale(0.94);
  }
}
@keyframes bossFloat {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50%      { transform: translateY(-10px) rotate(1deg); }
}
@keyframes bossGlow {
  from { opacity: 0.55; }
  to   { opacity: 1; }
}

.bt-boss-art {
  position: relative;
  width: 100%;
  height: auto;
  max-height: 300px;
  pointer-events: none;
  filter:
    drop-shadow(0 0 24px rgba(255, 59, 26, 0.6))
    drop-shadow(8px 8px 0 var(--black));
}

/* Spawn shake — overrides the float briefly on activation */
.boss-takeover.shake .bt-boss-art-wrap {
  animation:
    bossSpawnShake 0.5s ease-out,
    bossFloat 2.4s ease-in-out 0.5s infinite;
}
@keyframes bossSpawnShake {
  0%   { transform: scale(2.5) rotate(-15deg); opacity: 0; filter: blur(12px); }
  50%  { transform: scale(0.85) rotate(4deg); opacity: 1; filter: blur(0); }
  70%  { transform: scale(1.05) rotate(-2deg); }
  100% { transform: scale(1) rotate(0); }
}

/* Footer with title, HP bar, timer */
.bt-boss-foot {
  display: grid;
  gap: 12px;
}

.bt-boss-title-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
}
.bt-boss-title {
  font-family: "ivy-presto", serif;
  font-style: italic;
  font-weight: 900;
  font-size: 64px;
  color: var(--white);
  letter-spacing: -0.02em;
  line-height: 0.9;
  text-shadow: 5px 5px 0 var(--black);

  .accent { color: $boss-red; }

  @include bp-below("lg") { font-size: 44px; text-shadow: 3px 3px 0 var(--black); }
  @include bp("sm")       { font-size: 32px; text-shadow: 2px 2px 0 var(--black); }
}

.bt-hp-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.bt-hp-label {
  font-family: "KHInterference", monospace;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.2em;
  color: $boss-red;
}
.bt-hp-bar {
  flex: 1;
  height: 18px;
  background: rgba(255, 59, 26, 0.15);
  border: 3px solid $boss-red;
  position: relative;
  overflow: hidden;

  > .fill {
    height: 100%;
    background: repeating-linear-gradient(
      45deg,
      $boss-red 0 8px,
      $boss-red-dark 8px 16px
    );
    transition: width 0.25s ease-out;
  }

  > .ticks {
    position: absolute;
    inset: 0;
    display: flex;
    pointer-events: none;

    span {
      flex: 1;
      border-right: 1px solid rgba(0, 0, 0, 0.35);

      &:last-child { border-right: none; }
    }
  }
}
.bt-hp-num {
  font-family: "KHInterference", sans-serif;
  font-weight: bold;
  font-size: 22px;
  color: var(--white);
  font-variant-numeric: tabular-nums;
  min-width: 110px;
  text-align: right;

  @include bp("sm") { font-size: 16px; min-width: 80px; }
}

.bt-actions {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
}
.bt-timer-bar {
  flex: 1;
  min-width: 200px;
  height: 22px;
  background-color: rgba(255, 255, 255, 0.08);
  border: 2px solid var(--primary);
  position: relative;
  overflow: hidden;

  .bt-timer-fill {
    height: 100%;
    background-color: var(--primary);
    transition: width 0.1s linear;
  }

  > span {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--black);
    font-weight: bold;
    font-variant-numeric: tabular-nums;
    mix-blend-mode: difference;
    color: var(--white);
  }
}
.bt-reward {
  font-family: "KHInterference", monospace;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.16em;
  color: rgba(255, 255, 255, 0.7);

  .pen { color: $boss-red; }
}

/* Hit shake — four variants so consecutive clicks don't replay the same motion */
.bt-boss-art.hit-shake-1 { animation: hitShake1 0.2s ease-out; }
.bt-boss-art.hit-shake-2 { animation: hitShake2 0.2s ease-out; }
.bt-boss-art.hit-shake-3 { animation: hitShake3 0.2s ease-out; }
.bt-boss-art.hit-shake-4 { animation: hitShake4 0.2s ease-out; }

@keyframes hitShake1 {
  0%   { transform: translate(0, 0) rotate(0); }
  25%  { transform: translate(-7px, 4px) rotate(-4deg); }
  55%  { transform: translate(6px, -2px) rotate(3deg); }
  80%  { transform: translate(-3px, 2px) rotate(-1deg); }
  100% { transform: translate(0, 0) rotate(0); }
}
@keyframes hitShake2 {
  0%   { transform: translate(0, 0) rotate(0); }
  25%  { transform: translate(8px, 3px) rotate(5deg); }
  55%  { transform: translate(-5px, -3px) rotate(-2deg); }
  80%  { transform: translate(2px, 1px) rotate(1deg); }
  100% { transform: translate(0, 0) rotate(0); }
}
@keyframes hitShake3 {
  0%   { transform: translate(0, 0) rotate(0) scale(1); }
  20%  { transform: translate(-4px, -5px) rotate(-2deg) scale(0.96); }
  50%  { transform: translate(5px, 4px) rotate(4deg) scale(1.04); }
  80%  { transform: translate(-2px, -1px) rotate(-1deg) scale(1); }
  100% { transform: translate(0, 0) rotate(0) scale(1); }
}
@keyframes hitShake4 {
  0%   { transform: translate(0, 0) rotate(0); }
  18%  { transform: translate(6px, -4px) rotate(3deg); }
  45%  { transform: translate(-7px, 3px) rotate(-5deg); }
  72%  { transform: translate(3px, -1px) rotate(2deg); }
  100% { transform: translate(0, 0) rotate(0); }
}

/* ── Countdown stage ── */
.bt-countdown {
  position: relative;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}
.bt-count-tag {
  position: absolute;
  top: 14%;
  left: 50%;
  transform: translateX(-50%);
  font-family: "KHInterference", monospace;
  font-weight: bold;
  font-size: 18px;
  letter-spacing: 0.4em;
  color: $boss-red;
  border-top: 3px solid $boss-red;
  border-bottom: 3px solid $boss-red;
  padding: 8px 24px;
  background: rgba(0, 0, 0, 0.5);
}
.bt-count-sub {
  position: absolute;
  bottom: 16%;
  left: 50%;
  transform: translateX(-50%);
  font-family: "KHInterference", monospace;
  font-weight: bold;
  font-size: 13px;
  letter-spacing: 0.3em;
  color: rgba(255, 255, 255, 0.55);
  text-align: center;
}
.bt-count-num {
  font-family: "KHInterference", sans-serif;
  font-weight: bold;
  font-size: 340px;
  line-height: 0.85;
  color: var(--white);
  -webkit-text-stroke: 6px var(--black);
  text-stroke: 6px var(--black);
  letter-spacing: -0.04em;
  text-shadow: 8px 8px 0 var(--black);

  @include bp-below("lg") {
    font-size: 220px;
    -webkit-text-stroke-width: 4px;
    text-shadow: 5px 5px 0 var(--black);
  }
  @include bp("sm") {
    font-size: 140px;
    -webkit-text-stroke-width: 3px;
    text-shadow: 3px 3px 0 var(--black);
  }

  &.go {
    font-family: "ivy-presto", serif;
    font-style: italic;
    font-weight: 900;
    font-size: 200px;
    color: $boss-red;
    -webkit-text-stroke: 0;
    text-stroke: 0;
    text-shadow: 6px 6px 0 var(--black);

    @include bp-below("lg") { font-size: 140px; }
    @include bp("sm")       { font-size: 90px; text-shadow: 3px 3px 0 var(--black); }
  }
}

/* The countdown number stays mounted across digits — only a brief
   .tick flash plays on each label change. Smoother than re-mounting. */
.bt-count-num.tick {
  animation: countTick 0.36s cubic-bezier(0.2, 1.4, 0.4, 1);
}
@keyframes countTick {
  0%   { transform: scale(0.6); filter: blur(6px); opacity: 0.4; }
  35%  { transform: scale(1.18); filter: blur(0); opacity: 1; }
  100% { transform: scale(1); filter: blur(0); opacity: 1; }
}

/* Cursor hitmarks — fixed-positioned X spawned at click coords */
.bt-hitmark-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 510;
}
.bt-hitmark {
  position: absolute;
  transform: translate(-50%, -50%);
  font-family: "ivy-presto", serif;
  font-style: italic;
  font-weight: 900;
  font-size: var(--size, 64px);
  line-height: 1;
  color: var(--white);
  text-shadow:
    0 0 12px rgba(255, 59, 26, 0.9),
    3px 3px 0 var(--black);
  user-select: none;
  pointer-events: none;
  animation: hitmarkPop 0.6s ease-out forwards;
  --rot: 0deg;
}
@keyframes hitmarkPop {
  0% {
    transform: translate(-50%, -50%) scale(0.4) rotate(var(--rot));
    opacity: 0;
  }
  18% {
    transform: translate(-50%, -50%) scale(1.45) rotate(var(--rot));
    opacity: 1;
  }
  60% {
    transform: translate(-50%, -50%) scale(1) rotate(var(--rot));
    opacity: 0.95;
  }
  100% {
    transform: translate(-50%, calc(-50% - 36px)) scale(0.85) rotate(var(--rot));
    opacity: 0;
  }
}

/* Takeover entry/exit transition */
.boss-takeover-fade-enter-active,
.boss-takeover-fade-leave-active {
  transition: opacity 0.25s ease;
}
.boss-takeover-fade-enter-from,
.boss-takeover-fade-leave-to {
  opacity: 0;
}

/* Victory / defeat result overlay (kept from previous version) */
.boss-result {
  position: fixed;
  inset: 0;
  z-index: 501;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6em;
  background-color: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);

  &.victory { color: var(--primary); }
  &.defeat  { color: var(--error); }

  p {
    background-color: var(--black);
    padding: 40px 60px;
    animation: resultPop 0.4s ease-out;
  }
}
@keyframes resultPop {
  0%   { transform: scale(0.6) rotate(-3deg); opacity: 0; }
  60%  { transform: scale(1.08) rotate(1deg); opacity: 1; }
  100% { transform: scale(1) rotate(0); opacity: 1; }
}

.boss-result-fade-enter-active,
.boss-result-fade-leave-active {
  transition: opacity 0.8s ease;
}
.boss-result-fade-enter-from,
.boss-result-fade-leave-to {
  opacity: 0;
}
</style>
