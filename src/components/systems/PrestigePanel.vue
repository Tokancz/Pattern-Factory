<template>
  <Panel title="Prestige">
    <div>
      Reset everything for prestige points.
    </div>

    <button @click="prestige">
      PRESTIGE
    </button>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "./Panel.vue"
import { useGameStore } from "@/stores/useGameStore"

const game = useGameStore()

const prestige = game.prestige
</script>