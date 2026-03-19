<template>
  <section id="simulation">
    <div id="factory" @click="$emit('clickFactory')">
      <img src="/img/Factory.png" draggable="false">

      <svg
        viewBox="0 0 32 32"
        :style="{fill: currentPattern!.traits.color}"
        v-html="shapes![currentPattern!.traits.shape]">
      </svg>

      <p id="progress">
        Progress {{ Math.floor(creatingProgress! / currentPattern!.creationTime * 100) }} %
      </p>
    </div>

    <div id="belt"></div>

    <img
      v-for="machine in machines"
      v-show="machine.owned"
      :key="machine.id"
      :src="machine.src"
      :style="machinePos(machine)"
      class="machine"
    >

    <img src="/img/Seller.png" id="seller" draggable="false">

    <svg
      v-for="part in parts"
      :key="part.id"
      class="part"
      viewBox="0 0 32 32"
      :style="partStyle!(part)"
      v-html="shapes![part.traits.shape]">
    </svg>
  </section>
</template>

<script setup lang="ts">

import type { Part } from "@/types/Part"
import type { Machine } from "@/types/Machine"
import { gameStore } from "@/stores/useGameStore";

const { machines, currentPattern } = gameStore

const props = defineProps<{
  parts: Part[]
  shapes: Record<string, string>
  creatingProgress: number
  machinePos: (machine: Machine) => any
  partStyle: (part: Part) => any
}>()

const emit = defineEmits<{
  clickFactory: []
}>()

</script>

<style lang="scss">
section#simulation {
  position: relative;
  top: -30px;
  height: 600px;
  @include flexColumn(0px, space-between);

  #factory {
    position: relative;
    width: 200px;
    @include flexColumn();
    user-select: none;
    z-index: 1;
    cursor: pointer;

    svg {
      position: absolute;
      left: 58px;
      top: 58px;
      width: 80px;
    }
    #progress {
      position: absolute;
      top: 150px;
      color: var(--white);
    }
  }
  #belt {
    position: absolute;
    top: 180px;
    width: 60px;
    height: 350px;
    background-image: url(/img/Belt.png);
    background-size: contain;
  }
  .part {
    width: 60px;
    position: absolute;
  }
  .machine {
    position: absolute;
    user-select: none;
    width: 100px;
    z-index: 5;
  }
  #seller {
    width: 120px;
    user-select: none;
    z-index: 1;
  }
}
</style>