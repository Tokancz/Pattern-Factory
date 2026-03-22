<template>
  <Panel title="Upgrades">
    <div v-for="(u, id) in upgrades.levels" :key="id">
      <div>{{ id }}</div>
      <div>Lvl: {{ u }}</div>
      <div>Cost: {{ getCost(id) }}</div>

      <button @click="buy(id)">Buy</button>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "./Panel.vue"
import { useUpgradeStore } from "@/stores/useUpgradeStore"

const upgrades = useUpgradeStore()

const getCost = upgrades.getCost
const buy = upgrades.buy
</script>