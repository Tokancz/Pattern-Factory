<template>
  <div class="currency">
    <p>Money - {{ formatNumber(game.money) }} IGM</p>
    <p>DC - {{ formatNumber(game.dc) }}</p>
    <p>Prestige - 1x</p>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from "@/stores/game"
import { formatNumber } from "@/utils/format";

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