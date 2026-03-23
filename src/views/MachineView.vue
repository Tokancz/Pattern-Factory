<template>
  <Panel title="Machines">
    <div v-for="(m, id) in machines" :key="id">
      <div>{{ id }}</div>
      <div>Lvl: {{ levels[id] || 0 }}</div>

      <button @click="buy(id)">Buy</button>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { reactive } from "vue"

const machines = {
  slotUnlock: {},
  slotBoost: {}
}

const levels = reactive<Record<string, number>>({})

function buy(id: string) {
  levels[id] = (levels[id] || 0) + 1
}
</script>