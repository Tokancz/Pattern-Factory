<template>
  <Panel title="Machines">
    <div v-for="(machine, id) in MACHINES" :key="id" class="machine">
  
      <img :src="machine.src" alt="">

      <div class="text-container">
        <p class="machine-name">{{ machine.name }}</p>
        <p>{{ machine.description }}</p>

        <p class="machine-cost">Cost: {{ getCost(id) }}</p>
      </div>

      <button @click="buy(id)" class="button">Buy</button>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { MACHINES } from "@/data/machines"
import { useMachineStore } from "@/stores/machine"

const machines = useMachineStore()

const getCost = machines.getCost
const buy = machines.buy
</script>

<style scoped lang="scss">
@use "@/styles/views.scss";
</style>