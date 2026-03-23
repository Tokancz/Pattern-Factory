<template>
  <Panel title="Patterns">
    <div v-for="(p, id) in PATTERNS" :key="id" class="pattern">
      <img :src="p.visuals.icon" :alt="id" class="pattern-image">
      <div class="text-container">
        <p class="pattern-name">{{ id }}</p>
        <p> Base value: {{ p.baseValue }}</p>
      </div>
      <button @click="buy(id)" class="button">Buy</button>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { PATTERNS } from "@/data/patterns"
import { usePatternStore } from "@/stores/pattern"
import { useGameStore } from "@/stores/game"

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
@use "@/styles/views.scss";
</style>