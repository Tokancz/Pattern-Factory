<template>
<div class="pattern">

  <svg
    viewBox="0 0 32 32"
    :style="{ fill: pattern.traits.color }"
    v-html="shapes[pattern.traits.shape]">
  </svg>

  <p>Value: {{ displayValue(pattern) }}</p>
  <p>Exp: {{ formatNumber(pattern.baseExp) }}</p>
  <p>Creation time: {{ formatNumber(pattern.creationTime) }}</p>

  <button v-if="!pattern.owned" @click="$emit('buy', pattern)">
    Price: {{ formatNumber(pattern.price) }} IGM
  </button>

  <button v-else>
    Owned
  </button>

</div>
</template>

<script setup lang="ts">
import type { Pattern } from "@/types/Pattern"

const props = defineProps<{
  pattern: Pattern
  shapes: Record<string, string>
  formatNumber: (n: number) => string
  displayValue: (p: Pattern) => string
}>()

const emit = defineEmits<{
  buy: [pattern: Pattern]
}>()
</script>