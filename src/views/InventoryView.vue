<template>
  <Panel title="Inventory">
    <div class="pattern-grid">
      <div v-for="(p, id) in PATTERNS" :key="id" class="pattern">
        <img :src="p.visuals.icon" :alt="id" class="pattern-image">
        <div class="text-container-inventory">
          <p class="pattern-name">{{ id }}</p>
          <p>Lvl: {{ patterns.getPattern(id)?.level }}</p>
          <p>
            EXP: {{ formatNumber( patterns.getPattern(id)?.exp! ) }} /
            {{ formatNumber( expToNext(patterns.getPattern(id)!.level) ) }}
          </p>
          <p class="pattern-value">
            Value: {{ formatNumber(getValue(id)) }} 
            <span v-if="p.type === 'money'">IGM</span>
            <span v-else-if="p.type === 'exp'">EXP</span>
            <span v-else-if="p.type === 'dc'">DC</span>
            <span v-else-if="p.type === 'prestige'">PP</span>
          </p>
        </div>
      </div>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { formatNumber } from "@/utils/format"
import { PATTERNS } from "@/data/patterns"
import { usePatternStore } from "@/stores/pattern"

const patterns = usePatternStore()

const expToNext = patterns.expToNext
const getValue = patterns.getPatternValue

</script>

<style scoped lang="scss">
  @use "@/styles/views.scss";
</style>