<template>
  <Panel title="Inventory">
    <ul class="pattern-grid">
      <li v-for="(p, id) in PATTERNS" :key="id" class="pattern">
        <img :src="p.visuals.icon" :alt="id" class="pattern-image">
        <div class="text-container-inventory">
          <h3 class="pattern-name">{{ id }}</h3>
          <p>Lvl: {{ patterns.getPattern(id)?.level }}</p>
          <p>
            EXP: {{ formatNumber( Math.floor(patterns.getPattern(id)?.exp ?? 0) ) }} / {{ formatNumber( Math.floor(expToNext(patterns.getPattern(id)!.level)) ) }}
          </p>
          <p class="pattern-value">
            Value: {{ formatNumber(getValue(id)) }} 
            <span v-if="p.type === 'money'">IGM</span>
            <span v-else-if="p.type === 'exp'">EXP</span>
            <span v-else-if="p.type === 'dc'">DC</span>
            <span v-else-if="p.type === 'prestige'">PP</span>
          </p>
        </div>
      </li>
    </ul>
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