<template>
  <div id="stat-grid">
    <h3>Stats</h3>
    <div class="columns">
      <div class="column">
        <p>Click Power: {{ formatNumber(upgrades.getClickPower) }}</p>
        <p>Speed Multiplier: {{ formatNumber(upgrades.getSpeedMultiplier) }}x</p>
        <p>EXP Multiplier: {{ formatNumber(upgrades.getExpMultiplier) }}x</p>
      </div>
      <div class="column">
        <p>Sell Multiplier: {{ formatNumber(upgrades.getSellMultiplier) }}x</p>
        <p>Output Bonus: {{ formatNumber(upgrades.getPrestigeOutputBonus) }}x</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUpgradeStore } from "@/stores/upgrade"
import { formatNumber } from "@/utils/format"

const upgrades = useUpgradeStore()
</script>

<style scoped lang="scss">
#stat-grid {
  grid-column: stats;

  display: grid;
  grid-template-columns: 2fr 6fr;
  background-color: var(--primary);
  color: var(--black);

  @media (width < 425px) {
    font-size: .8em;
    grid-template-columns: 1fr;
  }

  h3 {
    display: block;
    width: 100%;
    height: 100%;
    font-size: 3em;
    padding: 10px;
    border-right: 4px solid var(--black);

    @media (width < 425px) {
      border-right: none;
      border-bottom: 4px solid var(--black);
      padding-bottom: 0px;
    }
  }

  .columns {
    width: 100%;
    @include flexRow(10px, start, end);
    padding: 10px;

    .column {
      @include flexColumn(5px, start, start);
      font-weight: bold;
      font-size: 1.25em;
    }
  }
}
</style>