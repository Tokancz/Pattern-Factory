<template>
  <Panel title="Patterns">
    <div class="pattern-grid">
      <div v-for="(p, id) in PATTERNS" :key="id" class="pattern">
        <img :src="p.visuals.icon" :alt="id" class="pattern-image">
        <div class="text-container">
          <p class="pattern-name">{{ id }}</p>
          
          <p>
            Base value: {{ formatNumber(p.baseValue) }} 
            <span v-if="p.type === 'money'">IGM</span>
            <span v-else-if="p.type === 'exp'">EXP</span>
            <span v-else-if="p.type === 'dc'">DC</span>
            <span v-else>Special</span>
          </p>

          <p v-if="p.requirements && !patterns.unlockedPatterns.includes(id)" class="requirements">
            Unlock requires: 
            <span v-if="'money' in p.requirements">{{ formatNumber(p.requirements.money) }} IGM </span>
            <span v-if="'dc' in p.requirements">{{ formatNumber(p.requirements.dc) }} DC </span>
            <span v-if="'level' in p.requirements">Level {{ p.requirements.level }} </span>
          </p>
        </div>

        <button
          v-if="!patterns.unlockedPatterns.includes(id)"
          @click="patterns.buyPattern(id)"
          class="button"
        > Buy
        </button>
      </div>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { PATTERNS } from "@/data/patterns"
import { usePatternStore } from "@/stores/pattern"
import { formatNumber } from "@/utils/format"

const patterns = usePatternStore()

</script>

<style scoped lang="scss">
@use "@/styles/views.scss";
</style>