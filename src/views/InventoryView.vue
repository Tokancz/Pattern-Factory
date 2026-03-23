<template>
  <Panel title="Inventory">
    <div v-for="(p, id) in patterns.patterns" :key="id">
      <div>{{ id }}</div>
      <div>Lvl: {{ p.level }}</div>
      <div>
        EXP: {{ p.exp }} /
        {{ expToNext(p.level) }}
      </div>
      <div>Value: {{ getValue(id) }}</div>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { usePatternStore } from "@/stores/pattern"

const patterns = usePatternStore()

const expToNext = patterns.expToNext
const getValue = patterns.getPatternValue
</script>