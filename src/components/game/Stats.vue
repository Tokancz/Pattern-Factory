<template>
  <div id="stat-grid">
    <h3>Stats</h3>
    <div class="columns">

      <div class="column">
        <p>Click Power: {{ formatNumber(upgrades.getClickPower) }}</p>
        <p>Speed: {{ formatNumber(upgrades.getSpeedMultiplier) }}x</p>
        <p>Overclock: {{ formatNumber(machines.getMultiplier("slotBoost")) }}x</p>
        <p>EXP Gain: {{ formatNumber(upgrades.getExpMultiplier) }}x</p>
      </div>

      <div class="column">
        <p>Sell Mult: {{ formatNumber(upgrades.getSellMultiplier) }}x</p>
        <p>Output Bonus: {{ formatNumber(upgrades.getPrestigeOutputBonus) }}x</p>
        <p>Output Boost: {{ formatNumber(machines.getMultiplier("outputBoost")) }}x</p>
        <p>EXP Machine: {{ formatNumber(machines.getMultiplier("expMachine")) }}x</p>
      </div>

      <div class="column">
        <p>Synergies: {{ synergy.activeSynergies.length }} active</p>
        <p>Synergy Boost: +{{ formatNumber((synergy.synergyAmplifier - 1) * 100) }}%</p>
        <p>Prestige Gain: {{ game.canPrestige ? formatNumber(game.getPrestigeGain()) + " PP" : "—" }}</p>
        <p>Offline Cap: {{ formatOfflineCap(upgrades.getOfflineCap) }}</p>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { useUpgradeStore } from "@/stores/upgrade"
import { useMachineStore } from "@/stores/machine"
import { useSynergyStore }  from "@/stores/synergy"
import { useGameStore }     from "@/stores/game"
import { formatNumber }     from "@/utils/format"

const upgrades = useUpgradeStore()
const machines = useMachineStore()
const synergy  = useSynergyStore()
const game     = useGameStore()

function formatOfflineCap(seconds: number): string {
  const hours = seconds / 3600
  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`
}
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

      @media (width < 768px) {
        font-size: 1em;
      }
    }
  }
}
</style>
