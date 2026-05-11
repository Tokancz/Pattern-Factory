<template>
  <Panel title="Patterns">
    <ul class="pattern-grid" :style="{ '--cols': patternCount }">
      <li v-for="(p, id) in visiblePatterns" :key="id" class="pattern">
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
            <span v-else-if="p.type === 'prestige'">PP</span>
            <span v-else-if="p.type === 'glyph'">Γ</span>
            <span v-else>Special</span>
          </p>

          <p v-if="p.requirements && !patterns.unlockedPatterns.includes(id)" class="requirements">
            Unlock requires:
            <span v-if="'money' in p.requirements">{{ formatNumber(patterns.getPatternUnlockCost(id, 'money')) }} IGM </span>
            <span v-if="'dc' in p.requirements">{{ formatNumber(patterns.getPatternUnlockCost(id, 'dc')) }} DC </span>
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
import { computed } from "vue"
import Panel from "../components/system/Panel.vue"
import { PATTERNS } from "@/data/patterns"
import { usePatternStore } from "@/stores/pattern"
import { useGlyphStore } from "@/stores/glyph"
import { formatNumber } from "@/utils/format"

const patterns = usePatternStore()
const glyph    = useGlyphStore()

// Glyph pattern stays hidden from the catalogue until the Glyph Pattern
// Glyph upgrade is owned. Other patterns always render.
const visiblePatterns = computed(() => {
  const showGlyph = glyph.hasUpgrade("glyphPattern")
  return Object.fromEntries(
    Object.entries(PATTERNS).filter(([id]) => showGlyph || id !== "glyph")
  ) as typeof PATTERNS
})

const patternCount = computed(() => Object.keys(visiblePatterns.value).length)
</script>

<style scoped lang="scss">
@use "@/styles/views.scss";
</style>