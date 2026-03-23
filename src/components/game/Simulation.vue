<template>
  <div class="simulation">
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
  width: 100%;
  height: 100%;

  @include flexRow();

  background-color: var(--secondary);
  grid-area: patterns;
  display: flex;
  gap: 10px;
}
</style>