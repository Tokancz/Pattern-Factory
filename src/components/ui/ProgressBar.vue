<template>
  <div class="progress">
    {{ bar }}
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useProgressStore } from "@/stores/progress"
import { useGameStore } from "@/stores/game";
import { generateBar } from "@/utils/ascii"

const props = defineProps<{
  type: "progress" | "level"
  value?: number
  max?: number
  length?: number
}>()

const progress = useProgressStore()
const game = useGameStore()

const bar = computed(() => {
  if (props.type === "progress") {
    return "CREATING PART " + generateBar(
      props.value ?? progress.progress,
      props.max ?? progress.maxProgress,
      props.length ?? 20
    )
  } else if (props.type === "level") {
    return `LVL.${game.level} ` + generateBar(
      game.exp,
      game.expToNextLevel,
      props.length ?? 20
    )
  } else {
    return ""
  }
})
</script>

<style lang="scss">
.progress {
    color: var(--white);
    font-size: 1.25em;
}
</style>