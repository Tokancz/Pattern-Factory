<template>
  <div class="patterns">
    <button
      v-for="p in patterns.unlockedPatterns"
      :key="p"
      :class="{ active: game.activePattern === p }"
      @click="game.setActivePattern(p)"
    >
      {{ p.toUpperCase() }} (lvl {{ patterns.getPatternLevel(p) }})
    </button>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from "@/stores/game"
import { usePatternStore } from "@/stores/pattern"

const game = useGameStore()
const patterns = usePatternStore()
</script>

<style lang="scss">
.patterns {
  display: flex;
  gap: 10px;

  button {
    padding: 10px;
    background: var(--black);
    color: var(--white);
    border: 1px solid var(--primary);
    cursor: pointer;
  }

  .active {
    background: var(--primary);
    color: var(--black);
  }
}
</style>