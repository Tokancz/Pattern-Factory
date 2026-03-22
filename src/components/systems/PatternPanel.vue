<template>
  <Panel title="Patterns">
    <div v-for="(p, id) in PATTERNS" :key="id">
      <div>{{ id }}</div>
      <div>Base: {{ p.baseValue }}</div>

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