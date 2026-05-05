<template>
  <Transition name="boss-fade">
    <div v-if="boss.isActive" class="takeover is-on" :class="{ 'is-bossOn': true, 'is-shake': shaking, 'is-flash': flashing }" role="dialog" aria-modal="true">
      <div class="tk-vignette"></div>
      <div class="tk-grid"></div>
      <div class="tk-scanlines"></div>
      <div class="tk-hazard tk-hazard--top"></div>
      <div class="tk-hazard tk-hazard--bot"></div>

      <div class="tk-reveal">
        <div class="tk-corner tk-corner--tl">▌ ENC-{{ encId }}</div>
        <div class="tk-corner tk-corner--tr">SECTOR · 01</div>
        <div class="tk-corner tk-corner--bl">THREAT · A</div>
        <div class="tk-corner tk-corner--br">⚠ DEFEND</div>

        <div class="tk-head">
          <div class="tk-tag">⚠ BOSS ENCOUNTER</div>
          <div class="tk-meta">LVL.{{ game.level }} · TIMER {{ formatTime(boss.timeLeft) }}</div>
        </div>

        <div class="tk-body">
          <button
            class="tk-art-wrap tk-art-btn"
            type="button"
            @click="onHit"
            :aria-label="`Hit ${bossName} boss`"
          >
            <img class="tk-art" :src="bossArt" alt="" draggable="false">
          </button>
        </div>

        <div class="tk-foot">
          <div class="tk-title-row">
            <div class="tk-title"><span class="accent">{{ bossName.toUpperCase() }}</span> BOSS</div>
          </div>
          <div class="tk-hp-row">
            <span class="tk-hp-label">HP</span>
            <div class="tk-hp-bar">
              <div class="fill" :style="{ width: hpPct + '%' }"></div>
              <div class="ticks">
                <span v-for="n in 10" :key="n"></span>
              </div>
            </div>
            <span class="tk-hp-num">{{ boss.clicksRequired - boss.clicks }} / {{ boss.clicksRequired }}</span>
          </div>
          <div class="tk-actions">
            <div class="tk-reward">
              REWARD: KEEP {{ stealLabel }}<span class="pen">PENALTY: −ALL {{ stealLabel }}</span>
            </div>
            <div class="tk-btnrow">
              <span class="tk-timer">{{ boss.timeLeft.toFixed(1) }}s</span>
              <button class="tk-fight" type="button" @click="onHit">HIT →</button>
            </div>
          </div>
        </div>
      </div>

      <div class="tk-flash"></div>
    </div>
  </Transition>

  <Transition name="boss-result-fade">
    <div v-if="boss.lastResult" class="tk-result" :class="boss.lastResult" aria-live="polite">
      <p>{{ boss.lastResult === "victory" ? "VICTORY" : "DEFEATED" }}</p>
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

const shaking = ref(false)
const flashing = ref(false)

const bossName = computed(() => boss.activeBossId ?? "")
const bossArt = computed(() => {
  const id = boss.activeBossId ?? "square"
  return `/img/patterns/boss${id.charAt(0).toUpperCase()}${id.slice(1)}.svg`
})
const stealLabel = computed(() => STEAL_LABELS[boss.stealType] ?? boss.stealType)
const hpPct = computed(() => {
  if (!boss.clicksRequired) return 0
  const left = boss.clicksRequired - boss.clicks
  return Math.max(0, (left / boss.clicksRequired) * 100)
})
const encId = computed(() => String(game.level).padStart(3, "0"))

function formatTime(t: number) {
  return t.toFixed(1) + "s"
}

function onHit() {
  if (!boss.isActive) return
  boss.registerClick()
  flashing.value = true
  setTimeout(() => { flashing.value = false }, 240)
}

// shake on first appearance
watch(() => boss.isActive, (active) => {
  if (active) {
    shaking.value = true
    flashing.value = true
    setTimeout(() => { flashing.value = false }, 280)
    setTimeout(() => { shaking.value = false }, 600)
  }
})
</script>

<style scoped lang="scss">
.takeover {
  position: fixed;
  inset: 0;
  z-index: 500;
  display: grid;
  place-items: center;
  overflow: hidden;
  pointer-events: auto;
}

.tk-vignette {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at center, rgba(0, 0, 0, .55) 0%, rgba(50, 0, 10, .92) 70%, rgba(80, 0, 14, .97) 100%);
}
.tk-grid {
  position: absolute; inset: 0;
  @include grid-bg(40px, rgba($danger, .12));
  mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, #000 80%);
}
.tk-scanlines {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, rgba(#FFFFFF, .04) 0 1px, transparent 1px 4px);
  mix-blend-mode: overlay;
}
.tk-hazard {
  position: absolute; left: 0; right: 0;
  height: 14px;
  background: repeating-linear-gradient(45deg, $danger 0 14px, $bg 14px 28px);
  animation: hazardSlide .6s linear infinite;
  &--top { top: 0; }
  &--bot { bottom: 0; }
}
@keyframes hazardSlide { from { background-position: 0 0; } to { background-position: 56px 0; } }

.tk-flash {
  position: absolute; inset: 0;
  background: #FFFFFF;
  opacity: 0;
  pointer-events: none;
}
.takeover.is-flash .tk-flash { animation: flashHit .25s ease-out; }
@keyframes flashHit {
  0% { opacity: 0; }
  10% { opacity: 1; }
  100% { opacity: 0; }
}

.tk-reveal {
  position: relative;
  width: min(900px, 95vw);
  height: min(640px, 92vh);
  display: grid;
  grid-template-rows: auto 1fr auto;
  padding: 40px 56px;
  gap: $s-4;
  z-index: 2;
}

.tk-corner {
  position: absolute;
  @include label(10px, rgba($ink, .45));
  letter-spacing: .2em;
  &--tl { top: 24px; left: 24px; }
  &--tr { top: 24px; right: 24px; }
  &--bl { bottom: 24px; left: 24px; }
  &--br { bottom: 24px; right: 24px; color: rgba($danger, .8); }
}

.tk-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $s-3;
}
.tk-tag {
  @include chip($ink, $danger);
  font-size: 12px;
  padding: 6px 14px;
  letter-spacing: .2em;
  border-color: rgba(#000, .55);
  box-shadow: 0 0 24px rgba($danger, .45);
}
.tk-meta {
  font-family: $ff-mono;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: .18em;
  color: rgba($ink, .7);
}

.tk-body {
  position: relative;
  display: grid;
  place-items: center;
}
.tk-art-wrap {
  position: relative;
  width: 360px; height: 290px;
  display: grid;
  place-items: center;
  background: none;
  cursor: pointer;
  animation: bossFloat 2.4s ease-in-out infinite;

  &::before {
    content: "";
    position: absolute; inset: -22px;
    background: radial-gradient(circle, rgba($danger, .5) 0%, transparent 65%);
    filter: blur(22px);
    animation: bossGlow 1.4s ease-in-out infinite alternate;
  }
  &:active { transform: scale(.95); }
}
.takeover.is-shake .tk-art-wrap {
  animation: bossSpawnShake .5s ease-out, bossFloat 2.4s ease-in-out .5s infinite;
}
@keyframes bossFloat {
  0%, 100% { transform: translateY(0) rotate(-1deg); }
  50%      { transform: translateY(-10px) rotate(1deg); }
}
@keyframes bossGlow {
  from { opacity: .55; }
  to   { opacity: 1; }
}
@keyframes bossSpawnShake {
  0%   { transform: scale(2.5) rotate(-15deg); opacity: 0; filter: blur(12px); }
  50%  { transform: scale(.85) rotate(4deg); opacity: 1; filter: blur(0); }
  70%  { transform: scale(1.05) rotate(-2deg); }
  100% { transform: scale(1) rotate(0); }
}
.tk-art {
  position: relative;
  width: 100%;
  max-height: 290px;
  filter:
    drop-shadow(0 0 28px rgba($danger, .65))
    drop-shadow(0 12px 24px rgba(#000, .5));
  pointer-events: none;
}

.tk-foot {
  display: grid;
  gap: $s-3;
}
.tk-title-row {
  display: flex;
  gap: $s-3;
  align-items: baseline;
}
.tk-title {
  font-family: $ff-display;
  font-weight: 700;
  font-size: 56px;
  color: $ink;
  letter-spacing: -.02em;
  line-height: .95;
  text-shadow: 0 4px 0 rgba(#000, .7), 0 0 32px rgba($danger, .35);
  text-transform: uppercase;
  .accent { color: $danger; }
}

.tk-hp-row {
  display: flex;
  align-items: center;
  gap: $s-3;
}
.tk-hp-label { @include label(11px, $danger); letter-spacing: .2em; }
.tk-hp-bar {
  flex: 1;
  height: 18px;
  background: rgba($danger, .12);
  border: 2px solid $danger;
  border-radius: $r-pill;
  position: relative;
  overflow: hidden;

  > .fill {
    height: 100%;
    width: 100%;
    background: linear-gradient(180deg, lighten($danger, 8%) 0%, $danger 50%, darken($danger, 12%) 100%);
    box-shadow: 0 0 16px rgba($danger, .6);
    transition: width .3s $ease-out;
  }
  > .ticks {
    position: absolute; inset: 0;
    display: flex;
    pointer-events: none;
    span { flex: 1; border-right: 1px solid rgba(#000, .35); &:last-child { border-right: none; } }
  }
}
.tk-hp-num {
  font-family: $ff-display;
  font-weight: 700;
  font-size: 22px;
  color: $ink;
  @include tab-nums;
  min-width: 100px;
  text-align: right;
}

.tk-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $s-3;
}
.tk-reward {
  font-family: $ff-mono;
  font-weight: 700;
  font-size: 11px;
  letter-spacing: .14em;
  color: $success;
  .pen { color: $danger; margin-left: $s-4; }
}
.tk-btnrow {
  display: flex;
  align-items: center;
  gap: $s-3;
}
.tk-timer {
  font-family: $ff-mono;
  font-weight: 700;
  font-size: 14px;
  color: $ink-2;
  @include tab-nums;
}
.tk-fight {
  @include btn-danger;
  padding: 12px 24px;
  font-size: 16px;
  font-family: $ff-display;
  letter-spacing: .04em;
}

// result splash
.tk-result {
  position: fixed; inset: 0;
  z-index: 501;
  pointer-events: none;
  display: grid;
  place-items: center;
  background: rgba(#000, .35);
  backdrop-filter: blur(2px);
  font-family: $ff-display;
  font-weight: 700;
  font-size: 8em;
  letter-spacing: -.02em;

  &.victory p { color: $accent; text-shadow: 0 0 32px rgba($accent, .8); }
  &.defeat p  { color: $danger; text-shadow: 0 0 32px rgba($danger, .8); }
  p {
    background: rgba(#000, .8);
    padding: 30px 60px;
    border: 1px solid currentColor;
    border-radius: $r-lg;
  }
}

.boss-fade-enter-active,
.boss-fade-leave-active {
  transition: opacity .25s ease;
}
.boss-fade-enter-from,
.boss-fade-leave-to { opacity: 0; }

.boss-result-fade-enter-active,
.boss-result-fade-leave-active { transition: opacity .8s ease; }
.boss-result-fade-enter-from,
.boss-result-fade-leave-to { opacity: 0; }
</style>
