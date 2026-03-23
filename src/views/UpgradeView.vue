<template>
  <Panel title="Upgrades">
    <div v-for="(u, id) in upgrades.levels" :key="id">
      <svg></svg>
      <div>{{ id }}</div>
      <div>Lvl: {{ u }}</div>
      <div>Cost: {{ getCost(id) }}</div>

      <button @click="buy(id)">Buy</button>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { useUpgradeStore } from "@/stores/upgrade"

const upgrades = useUpgradeStore()

const getCost = upgrades.getCost
const buy = upgrades.buy
</script>