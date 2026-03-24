<template>
  <div class="progress">
    {{ bar }}
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useGameStore } from "@/stores/game";
import { generateBar } from "@/utils/ascii"

const props = defineProps<{
  type: "progress" | "level"
  value?: number
  max?: number
  length?: number
}>()

const game = useGameStore()

const bar = computed(() => {
  if (props.type === "level") {
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