<template>
  <div class="currency">
    <p>Money - {{ game.money.toFixed(0) }} IGM</p>
    <p>DC - {{ game.dc.toFixed(0) }}</p>
    <p>Prestige - 1x</p>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from "@/stores/useGameStore"

const game = useGameStore()
</script>

<style lang="scss">
.currency {
    grid-area: currency;

    @include flexRow(0, space-between);

    background-color: var(--primary);
    color: var(--black);

    p {
        @include flexRow();
        height: 100%;
        flex: 1;
        border-right: 2px solid var(--black);
        text-align: center;
    }
}
</style>