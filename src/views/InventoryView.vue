<template>
  <Panel title="Inventory">
    <div v-for="(p, id) in PATTERNS" :key="id" class="pattern">
      <img :src="p.src" :alt="id" class="pattern-image">
      <div class="text-container">
        <p class="pattern-name">{{ id }}</p>
        <div>Lvl: {{ patterns.getPattern(id)?.level }}</div>
        <div>
          EXP: {{ patterns.getPattern(id)?.exp }} /
          {{ expToNext(patterns.getPattern(id)!.level) }}
        </div>
      </div>
      <div>Value: {{ getValue(id) }}</div>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { PATTERNS } from "@/data/patterns"
import { usePatternStore } from "@/stores/pattern"

const patterns = usePatternStore()

const expToNext = patterns.expToNext
const getValue = patterns.getPatternValue
</script>

<style scoped lang="scss">
  @use "@/styles/views.scss";
</style>