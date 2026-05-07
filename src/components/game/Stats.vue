<template>
  <section id="stat-grid" aria-label="Player stats">
    <h3>Stats</h3>
    <div class="columns">

      <dl class="column">
        <div><dt>Click Power</dt><dd>{{ formatNumber(upgrades.getClickPower) }}</dd></div>
        <div><dt>Speed</dt><dd>{{ formatNumber(upgrades.getSpeedMultiplier) }}x</dd></div>
        <div><dt>Overclock</dt><dd>{{ formatNumber(machines.getMultiplier("slotBoost")) }}x</dd></div>
      </dl>

      <dl class="column">
        <div><dt>Sell Mult</dt><dd>{{ formatNumber(upgrades.getSellMultiplier) }}x</dd></div>
        <div><dt>Output Bonus</dt><dd>{{ formatNumber(upgrades.getPrestigeOutputBonus) }}x</dd></div>
        <div><dt>Output Boost</dt><dd>{{ formatNumber(machines.getMultiplier("outputBoost")) }}x</dd></div>
      </dl>

      <dl class="column">
        <div><dt>Synergies</dt><dd>{{ synergy.activeSynergies.length }} active</dd></div>
        <div><dt>Prestige Gain</dt><dd>{{ game.canPrestige ? formatNumber(game.getPrestigeGain()) + " PP" : "—" }}</dd></div>
        <div><dt>Offline Cap</dt><dd>{{ formatOfflineCap(upgrades.getOfflineCap) }}</dd></div>
      </dl>

    </div>
  </section>
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
section#stat-grid {
  grid-column: stats;

  display: grid;
  grid-template-columns: 2fr 6fr;
  background-color: var(--primary);
  color: var(--black);

  @include bp-below("xs") {
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

    @include bp-below("xs") {
      border-right: none;
      border-bottom: 4px solid var(--black);
      padding-bottom: 0;
    }
  }

  .columns {
    @include flexRow(20px, space-between, end);
    width: 100%;
    padding: 10px 30px;
    flex-wrap: wrap;

    @include bp("sm") { padding: 10px 14px; gap: 8px 12px; }

    .column {
      @include flexColumn(5px, start, start);
      font-weight: bold;
      font-size: 1em;
      margin: 0;
      min-width: 0;

      div { @include flexRow(6px, start, baseline); }
      dt::after { content: ":"; }
      dt, dd { margin: 0; }
    }
  }
}
</style>
