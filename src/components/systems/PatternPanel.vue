<template>
  <Panel title="Patterns">
    <div v-for="(p, id) in PATTERNS" :key="id" class="pattern">
      <img :src="p.src" :alt="id">
      <div class="id">{{ id }}</div>
      <div class="value">Base: {{ p.baseValue }}</div>
      <button @click="buy(id)">Buy</button>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "./Panel.vue"
import { PATTERNS } from "@/data/patterns"
import { usePatternStore } from "@/stores/usePatternStore"
import { useGameStore } from "@/stores/useGameStore"

const patterns = usePatternStore()
const game = useGameStore()

function buy(id: string) {
  const cost = 50 // later scale this

  if (game.money < cost) return

  game.money -= cost
  patterns.unlockPattern(id)
}
</script>

<style scoped lang="scss">
  .pattern {
    width: 100%;
    height: 100%;

    @include flexColumn(10px, center, center);

    color: var(--black);
    background-color: var(--white);

    img {
      width: 80px;
    }
    .id {
      font-size: 2em;
    }
    .value {
      font-size: 1.25em;
    }
  }
</style>