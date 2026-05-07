<template>
  <Panel title="Patterns">
    <ul class="pattern-grid">
      <li v-for="(p, id) in PATTERNS" :key="id" class="pattern">
        <img :src="p.visuals.icon" :alt="id" class="pattern-image">
        <div class="text-container">
          <h3 class="pattern-name">{{ id }}</h3>

          <p v-if="p.flavour" class="pattern-flavour">{{ p.flavour }}</p>
          <p v-if="p.roleHint" class="pattern-role">{{ p.roleHint }}</p>

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
      </li>
    </ul>
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