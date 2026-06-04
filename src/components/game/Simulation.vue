<template>
  <div class="simulation">
    <TutorialOverlay
      v-model="tutorialVisible"
      :steps="tutorialSteps"
    />

    <SettingsOverlay :open="settingsOpen" @close="closeSettings" />

    <div id="simulation-bg">
      <div>
        <img src="/img/patterns/Square.svg" alt="square pattern background" aria-hidden="true" draggable="false">
      </div>
      <div>
        <img src="/img/patterns/Cross.svg" alt="cross pattern background" aria-hidden="true" draggable="false">
        <img src="/img/patterns/Triangle.svg" alt="triangle pattern background" aria-hidden="true" draggable="false">
      </div>
    </div>

    <div class="slot-container" :class="`slots-${slots.visibleSlots.length}`">
      <Slot
        v-for="slot in slots.visibleSlots"
        :key="slot.id"
        :slot="slot"
      />
    </div>
  
    <aside class="nav">
      <div class="top-buttons">
        <button type="button" class="tutorial-btn" @click="openTutorial">Tutorial</button>
        <button type="button" class="settings-btn" aria-label="Settings" @click="openSettings">
          <i class="fa-solid fa-gear" aria-hidden="true"></i>
        </button>
      </div>
      <div class="audio-controls">
        <button type="button" class="arrow" aria-label="Previous track" @click="cycleLoopTrack(-1)">‹</button>
        <button type="button" class="mute" @click="toggleMute" :aria-pressed="muted" :aria-label="muted ? 'Unmute' : 'Mute'">
          <i v-if="muted" class="fa-solid fa-volume-xmark" aria-hidden="true"></i>
          <i v-else class="fa-solid fa-volume" aria-hidden="true"></i>
          ({{ loopTrack }})
        </button>
        <button type="button" class="arrow" aria-label="Next track" @click="cycleLoopTrack(1)">›</button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { useSlotStore } from "@/stores/slot"
import Slot from "./Slot.vue"
import TutorialOverlay from "@/components/ui/TutorialOverlay.vue"
import SettingsOverlay from "@/components/ui/SettingsOverlay.vue"
import { TUTORIAL_STEPS } from "@/data/tutorial"
import { useMuted, toggleMute, useLoopTrack, cycleLoopTrack } from "@/utils/sound"
import { tutorialVisible, openTutorial } from "@/composables/tutorial"
import { useSettingsOpen, openSettings, closeSettings } from "@/composables/settings"

const slots = useSlotStore()
const tutorialSteps = TUTORIAL_STEPS
const muted = useMuted()
const loopTrack = useLoopTrack()
const settingsOpen = useSettingsOpen()
</script>

<style scoped lang="scss">
.simulation {
  position: relative;
  width: 100%;
  height: 100%;

  @include flexRow(0, center, center);

  background-color: var(--secondary);
  grid-area: patterns;

  .slot-container {
    display: grid;
    gap: 20px;
    z-index: 1;

    @include bp-below("lg") { padding: 80px 0; }

    // ─── 4-thread layout (default — no Slot V) ─────────────────────────
    &.slots-4 {
      grid-template-columns: repeat(4, 1fr);

      @include bp("md") {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 50px 20px;
        padding: 60px 0;
      }
    }

    // ─── 5-thread layout (Slot V owned) ────────────────────────────────
    // Desktop: a single row of 5. Tablet: 3 + 2 with the bottom row
    // centered via a 6-col grid where each tile spans 2 cols. Phone:
    // 2 + 2 + 1 with the 5th tile centered via grid-column: 1 / -1.
    //
    // Row gap on mobile has to clear the progress-bar overhang from
    // Slot.vue (positioned `bottom: -40px` + ~14px text ≈ 54px). With
    // less than that, row-1's progress bars overflow into row-2 slots.
    &.slots-5 {
      grid-template-columns: repeat(5, 1fr);

      @include bp("md") {
        grid-template-columns: repeat(6, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 70px 12px;
        padding: 60px 0;

        > :nth-child(1) { grid-column: 1 / 3; grid-row: 1; }
        > :nth-child(2) { grid-column: 3 / 5; grid-row: 1; }
        > :nth-child(3) { grid-column: 5 / 7; grid-row: 1; }
        > :nth-child(4) { grid-column: 2 / 4; grid-row: 2; }
        > :nth-child(5) { grid-column: 4 / 6; grid-row: 2; }
      }

      @include bp("sm") {
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(3, auto);
        gap: 65px 12px;

        // Reset desktop/tablet column placement so the 2-col grid auto-flows.
        > :nth-child(n) { grid-column: auto; grid-row: auto; }

        > :nth-child(5) {
          grid-column: 1 / -1;
          justify-self: center;
        }
      }
    }
  }

  #simulation-bg {
    @include flexColumn(0, space-between);
    position: absolute;
    width: 100%;
    height: 100%;
    padding: 10px;
    pointer-events: none;
    opacity: 0.8;
    z-index: 0;

    div {
      @include flexRow(0, space-between);
      width: 100%;

      img {
        width: 60px;
        user-select: none;

        @include bp-below("lg") { width: 50px; }
        @include bp("sm")       { width: 40px; }
      }
    }
  }

  .nav {
    @include flexColumn(0px, start, end);
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    z-index: 10;

    button {
      width: 100%;
      height: 40px;
      font-size: 1.25em;
      color: var(--white);
      background: var(--black);
      border: none;
      padding: 10px 20px;
      cursor: pointer;
      text-align: end;

      &:hover {
        background: var(--primary);
        color: var(--black);
      }
    }

    .top-buttons {
      @include flexRow(0, end, stretch);
      width: 100%;

      .tutorial-btn { flex: 1; }

      .settings-btn {
        width: 44px;
        flex: 0 0 44px;
        padding: 10px 0;
        text-align: center;
        border-left: 1px solid var(--secondary);
      }
    }

    .audio-controls {
      @include flexRow(0, end, stretch);
      width: 100%;
      background-color: var(--black);

      .arrow {
        width: 40px;
        padding: 10px 0;
        text-align: center;
        font-size: 1.25em;
      }

      .mute {
        flex: 1;
        text-align: center;
      }
    }
  }
}
</style>