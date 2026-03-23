<template>
  <Panel title="Upgrades">
    <div v-for="(upgrade, id) in UPGRADES" :key="id" class="upgrade">
      <img :src="upgrade.src" alt="Upgrade Image" draggable="false" class="upgrade-image"></img>
      <div class="text-container">
        <p class="upgrade-name">{{ upgrade.name }}</p>
        <p>{{ upgrade.description }}</p>
        <p v-if="levels[id] != 0">Lvl: {{ levels[id] }}</p>
        <p>Cost: {{ getCost(id) }}</p>
      </div>
      <button @click="buy(id)" class="button">Buy</button>
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

<style scoped lang="scss">
  @use "@/styles/views.scss";
</style>