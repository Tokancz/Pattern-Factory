<template>
  <div class="simulation">
    <TutorialOverlay
      v-model="tutorialVisible"
      :steps="tutorialSteps"
    />

    <div id="simulation-bg">
      <div>
        <img src="/img/patterns/Square.svg" alt="square pattern background" aria-hidden="true" draggable="false">
      </div>
      <div>
        <img src="/img/patterns/Cross.svg" alt="cross pattern background" aria-hidden="true" draggable="false">
        <img src="/img/patterns/Triangle.svg" alt="triangle pattern background" aria-hidden="true" draggable="false">
      </div>
    </div>

    <div class="slot-container">
      <Slot
        v-for="slot in slots.slots"
        :key="slot.id"
        :slot="slot"
      />
    </div>
  
    <aside class="nav">
      <button type="button" @click="openTutorial">Tutorial</button>
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
import { TUTORIAL_STEPS } from "@/data/tutorial"
import { useMuted, toggleMute, useLoopTrack, cycleLoopTrack } from "@/utils/sound"
import { tutorialVisible, openTutorial } from "@/composables/tutorial"

const slots = useSlotStore()
const tutorialSteps = TUTORIAL_STEPS
const muted = useMuted()
const loopTrack = useLoopTrack()
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
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    z-index: 1;

    @include bp-below("lg") { padding: 80px 0; }
    @include bp("md") {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 50px 20px;
      padding: 60px 0;
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