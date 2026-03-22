<template>
  <div class="progress">
    {{ bar }}
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useProgressStore } from "@/stores/useProgressStore"
import { generateBar } from "@/utils/ascii"

const progress = useProgressStore()

const bar = computed(() =>
  generateBar(progress.progress, progress.maxProgress, 20)
)
</script>

<style lang="scss">
.progress {
    color: var(--white);
    font-size: 1.25em;
}
</style>