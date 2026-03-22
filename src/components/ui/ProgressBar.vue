<template>
  <div class="progress">
    {{ props.prefix }} {{ bar }}
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useProgressStore } from "@/stores/useProgressStore"
import { generateBar } from "@/utils/ascii"

const props = defineProps<{
  prefix?: string
  value?: number
  max?: number
  length?: number
}>()

const progress = useProgressStore()

const bar = computed(() =>
  generateBar(
    props.value ?? progress.progress,
    props.max ?? progress.maxProgress,
    props.length ?? 20
  )
)
</script>

<style lang="scss">
.progress {
    color: var(--white);
    font-size: 1.25em;
}
</style>