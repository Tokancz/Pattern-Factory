<template>
  <button class="click" @click="progress.click()">
    CLICK
  </button>
</template>

<script setup lang="ts">
import { useProgressStore } from "@/stores/useProgressStore"

const progress = useProgressStore()
</script>

<style lang="scss">
.click {
  padding: 20px;
  font-size: 20px;
  background: var(--secondary);
  color: var(--white);
  border: none;
  cursor: pointer;

  &:active {
    transform: scale(0.95);
  }
}
</style>