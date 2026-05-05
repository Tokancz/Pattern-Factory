<template>
  <div class="simulation">

    <!-- stat row -->
    <div class="stats">
      <div class="stat">
        <div class="stat__lbl">Click<br/>Power</div>
        <div class="stat__num">{{ formatNumber(upgrades.getClickPower) }}</div>
        <div class="stat__sub">
          <span>per tap</span>
          <span>· {{ formatNumber(upgrades.getClickPower / 4) }}× base</span>
        </div>
      </div>
      <div class="stat stat--combo">
        <div class="stat__lbl">Speed</div>
        <div class="stat__num">×{{ formatNumber(upgrades.getSpeedMultiplier) }}</div>
        <div class="stat__sub">
          <span>output multiplier</span>
          <span>· {{ formatNumber(machines.getMultiplier("slotBoost")) }}× boost</span>
        </div>
      </div>
    </div>

    <!-- factory stage -->
    <div class="factory" id="factory" ref="factoryEl" @click="onFactoryClick">
      <img class="corner corner--tl" src="/img/patterns/Square.svg"   alt="" aria-hidden="true">
      <img class="corner corner--tr" src="/img/patterns/Circle.svg"   alt="" aria-hidden="true">
      <img class="corner corner--bl" src="/img/patterns/Cross.svg"    alt="" aria-hidden="true">
      <img class="corner corner--br" src="/img/patterns/Triangle.svg" alt="" aria-hidden="true">

      <div class="slots">
        <Slot v-for="slot in slots.slots" :key="slot.id" :slot="slot" />
      </div>

      <!-- ambient audio controls float -->
      <div class="audio-strip">
        <button type="button" class="audio-btn" aria-label="Previous track" @click.stop="cycleLoopTrack(-1)">‹</button>
        <button type="button" class="audio-btn audio-mute" @click.stop="toggleMute" :aria-pressed="muted">
          <i v-if="muted" class="fa-solid fa-volume-xmark" aria-hidden="true"></i>
          <i v-else class="fa-solid fa-volume" aria-hidden="true"></i>
          <span>{{ loopTrack }}</span>
        </button>
        <button type="button" class="audio-btn" aria-label="Next track" @click.stop="cycleLoopTrack(1)">›</button>
      </div>
    </div>

    <!-- strip -->
    <div class="strip">
      <div class="strip__left">
        <span class="strip__count">{{ slottedCount }} / 4 SLOTTED</span>
        <span class="strip__hint">scroll a slot to swap pattern · shift+click to overclock</span>
      </div>
      <router-link to="/patterns" class="strip__cta">Open Pattern Library →</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useSlotStore } from "@/stores/slot"
import { useUpgradeStore } from "@/stores/upgrade"
import { useMachineStore } from "@/stores/machine"
import Slot from "./Slot.vue"
import { formatNumber } from "@/utils/format"
import { useMuted, toggleMute, useLoopTrack, cycleLoopTrack } from "@/utils/sound"

const slots = useSlotStore()
const upgrades = useUpgradeStore()
const machines = useMachineStore()

const muted = useMuted()
const loopTrack = useLoopTrack()

const factoryEl = ref<HTMLElement | null>(null)

const slottedCount = computed(() => slots.slots.filter(s => s.unlocked && s.patternId).length)

// background click feedback (decorative — does not produce currency, individual
// slots own that)
function onFactoryClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest(".slot, .audio-btn, .strip")) return
  if (!factoryEl.value) return
  factoryEl.value.animate(
    [{ transform: "translate(0,0)" }, { transform: "translate(2px,-2px)" }, { transform: "translate(-1px,1px)" }, { transform: "translate(0,0)" }],
    { duration: 140 }
  )
}
</script>

<style scoped lang="scss">
.simulation {
  grid-area: patterns;
  display: flex;
  flex-direction: column;
  gap: $s-4;
  padding: $s-5 $s-5 $s-4;
  min-height: 0;
}

// stat row
.stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: $s-4;
}
.stat {
  @include panel($surface);
  display: flex;
  align-items: center;
  gap: $s-4;
  padding: $s-4 $s-5;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 100% at 100% 50%, rgba($accent, .08) 0%, transparent 70%);
    pointer-events: none;
  }

  &__lbl {
    @include label(10px);
    line-height: 1.2;
    flex-shrink: 0;
  }
  &__num {
    font-family: $ff-display;
    font-weight: 700;
    font-size: 36px;
    line-height: 1;
    color: $accent;
    @include tab-nums;
    text-shadow: 0 0 16px rgba($accent, .35);
  }
  &__sub {
    margin-left: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: flex-end;
    font-family: $ff-mono;
    font-size: 10px;
    color: $ink-3;
    text-align: right;
    letter-spacing: .04em;
  }
  &--combo {
    .stat__num { color: $warm; text-shadow: 0 0 16px rgba($warm, .4); }
    &::before { background: radial-gradient(ellipse 60% 100% at 100% 50%, rgba($warm, .1) 0%, transparent 70%); }
  }
}

// factory stage
.factory {
  flex: 1;
  min-height: 0;
  position: relative;
  border-radius: $r-lg;
  border: 1px solid rgba($purple, .35);
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba($purple, .25) 0%, transparent 70%),
    radial-gradient(ellipse 60% 80% at 50% 100%, rgba($accent, .18) 0%, transparent 70%),
    linear-gradient(180deg, #1A1340 0%, #0E0A2A 100%);
  box-shadow: $shadow-3, inset 0 0 0 1px rgba(#FFFFFF, .03);
  overflow: hidden;
  isolation: isolate;
  cursor: pointer;
  transition: transform .08s $ease;

  &::before {
    content: "";
    position: absolute; inset: 0;
    @include grid-bg(28px, rgba($accent, .055));
    mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, #000 0%, transparent 90%);
    pointer-events: none;
  }
  &::after {
    content: "";
    position: absolute; inset: 0;
    background: repeating-linear-gradient(0deg, transparent 0 3px, rgba(#FFFFFF, .025) 3px 4px);
    mix-blend-mode: overlay;
    pointer-events: none;
  }
  &:active { transform: scale(.997); }
}

.corner {
  position: absolute;
  width: 96px; height: 96px;
  opacity: .12;
  filter: brightness(0) invert(.8);
  pointer-events: none;
  &--tl { top: 24px;    left: 24px;   transform: rotate(-12deg); }
  &--tr { top: 24px;    right: 24px;  transform: rotate(8deg); }
  &--bl { bottom: 24px; left: 24px;   transform: rotate(14deg); }
  &--br { bottom: 24px; right: 24px;  transform: rotate(-6deg); }
}

.slots {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $s-5;
  padding: 30px 50px;
  z-index: 3;
}

.audio-strip {
  position: absolute;
  bottom: $s-3;
  right: $s-3;
  display: flex;
  align-items: stretch;
  border-radius: $r-pill;
  background: rgba(#000, .35);
  backdrop-filter: blur(8px);
  border: 1px solid $border;
  overflow: hidden;
  z-index: 4;
  font-family: $ff-mono;
  font-size: 11px;
}
.audio-btn {
  padding: 6px 10px;
  color: $ink-2;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  &:hover { color: $accent; background: rgba($accent, .08); }
  i { font-size: 12px; }
}
.audio-mute { padding: 6px 14px; }

// strip
.strip {
  @include panel($surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $s-3;
  padding: $s-3 $s-4;
  flex-shrink: 0;

  &__left {
    display: flex;
    align-items: center;
    gap: $s-4;
  }
  &__count {
    font-family: $ff-mono;
    font-weight: 700;
    font-size: 12px;
    color: $accent;
    letter-spacing: .1em;
    @include tab-nums;
  }
  &__hint { font-size: 11px; color: $ink-3; }
  &__cta {
    @include btn-primary;
    text-decoration: none;
  }
}

@media (max-width: 1024px) {
  .stat__num { font-size: 28px; }
  .corner { width: 64px; height: 64px; }
  .slots { gap: $s-3; padding: 20px; flex-wrap: wrap; }
}
</style>
