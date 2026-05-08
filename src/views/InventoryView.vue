<template>
  <Panel title="Archive">
    <ul class="pattern-grid">
      <li v-for="(p, id) in visiblePatterns" :key="id" class="pattern">
        <img :src="p.visuals.icon" :alt="id" class="pattern-image">
        <div class="text-container-inventory">
          <h3 class="pattern-name">{{ id }}</h3>
          <p v-if="p.flavour" class="pattern-flavour">{{ p.flavour }}</p>
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
            <span v-else-if="p.type === 'glyph'">Γ</span>
          </p>
        </div>
      </li>
    </ul>
  </Panel>
</template>

<script setup lang="ts">
import { computed } from "vue"
import Panel from "../components/system/Panel.vue"
import { formatNumber } from "@/utils/format"
import { PATTERNS } from "@/data/patterns"
import { usePatternStore } from "@/stores/pattern"
import { useGlyphStore } from "@/stores/glyph"

const patterns = usePatternStore()
const glyph    = useGlyphStore()

const expToNext = patterns.expToNext
const getValue  = patterns.getPatternValue

// Mirror PatternView: keep the glyph row out of the Archive until the
// Glyph Pattern Glyph upgrade is owned.
const visiblePatterns = computed(() => {
  const showGlyph = glyph.hasUpgrade("glyphPattern")
  return Object.fromEntries(
    Object.entries(PATTERNS).filter(([id]) => showGlyph || id !== "glyph")
  ) as typeof PATTERNS
})
</script>

<style scoped lang="scss">
  @use "@/styles/views.scss";
</style>