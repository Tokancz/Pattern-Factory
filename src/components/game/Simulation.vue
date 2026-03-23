<template>
  <div class="simulation">

    <p id="tag">Simulation</p>

    <div id="simulation-bg">
      <div>
        <img src="/img/patterns/Square.svg" alt="square pattern background" aria-hidden="true" draggable="false">
      </div>
      <div>
        <img src="/img/patterns/Triangle.svg" alt="triangle pattern background" aria-hidden="true" draggable="false">
        <img src="/img/patterns/Cross.svg" alt="cross pattern background" aria-hidden="true" draggable="false">
      </div>
    </div>

    <Slot
      v-for="slot in slots.slots"
      :key="slot.id"
      :slot="slot" ></Slot>
  </div>
</template>

<script setup lang="ts">
import { useSlotStore } from "@/stores/slot"
import Slot from "./Slot.vue"

const slots = useSlotStore()
</script>

<style scoped lang="scss">
.simulation {
  position: relative;
  width: 100%;
  height: 100%;

  @include flexRow();

  background-color: var(--secondary);
  grid-area: patterns;
  display: flex;
  gap: 10px;

  #simulation-bg {
    position: absolute;
    width: 100%;
    height: 100%;
    
    @include flexColumn(0, space-between);

    padding: 20px;
    pointer-events: none;
    opacity: 0.8;
    z-index: 0;

    div {
      width: 100%;
      @include flexRow(0, space-between);

      img {
        width: 80px;
        height: 80px;
        user-select: none;
      }
      p {
        font-size: 18px;
        color: var(--black);
      }
    }
  }
  #tag {
    position: absolute;
    top: 0;
    right: 0;

    font-size: 1.25em;
    background-color: var(--black);
    color: var(--white);
    padding: 10px 20px;
  }
}
</style>