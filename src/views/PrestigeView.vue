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
import Panel from "../components/system/Panel.vue"
import { useGameStore } from "@/stores/game"

const game = useGameStore()

const prestige = game.prestige
</script>