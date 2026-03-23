<template>
  <Panel title="Upgrades">
    <div v-for="(upgrade, id) in UPGRADES" :key="id">
      <img :src="upgrade.src"></img>
      <p>{{ upgrade.name }}</p>
      <p>{{ upgrade.description }}</p>
      <p v-if="levels[id] != 0">Lvl: {{ levels[id] }}</p>
      <p>Cost: {{ getCost(id) }}</p>

      <button @click="buy(id)">Buy</button>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { UPGRADES } from "@/data/upgrades"
import { useUpgradeStore } from "@/stores/upgrade"

const upgrades = useUpgradeStore()

const levels = upgrades.levels
const getCost = upgrades.getCost
const buy = upgrades.buy
</script>