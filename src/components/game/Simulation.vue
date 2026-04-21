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
      <SynergyPanel />
      <button type="button" @click="openTutorial">Tutorial</button>
      <button type="button" @click="toggleMute" :aria-pressed="muted">
        {{ muted ? "Unmute" : "Mute" }}
      </button>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useSlotStore } from "@/stores/slot"
import Slot from "./Slot.vue"
import SynergyPanel from "./SynergyPanel.vue"
import TutorialOverlay from "@/components/ui/TutorialOverlay.vue"
import { TUTORIAL_STEPS } from "@/data/tutorial"
import { useMuted, toggleMute } from "@/utils/sound"

const slots = useSlotStore()
const tutorialVisible = ref(false)
const tutorialSteps = TUTORIAL_STEPS
const muted = useMuted()

function openTutorial() {
  tutorialVisible.value = true
}
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

    @media (width < 1024px) {
      padding: 80px 0;
    }
    @media (width <= 768px) {
      grid-template-columns: repeat(2, 1fr);
      grid-template-rows: repeat(2, 1fr);
      gap: 50px 20px;
      padding: 60px 0;
    }
  }

  #simulation-bg {
    position: absolute;
    width: 100%;
    height: 100%;

    @include flexColumn(0, space-between);

    padding: 10px;
    pointer-events: none;
    opacity: 0.8;
    z-index: 0;

    div {
      width: 100%;
      @include flexRow(0, space-between);

      img {
        width: 60px;
        user-select: none;

        @media (width < 1024px) {
          width: 50px;
        }

        @media (width <= 480px) {
          width: 40px;
        }
      }
    }
  }

  .nav {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    @include flexColumn(0px, start, end);
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
  }
}
</style>