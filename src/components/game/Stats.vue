<template>
  <div class="footer">
    <div class="footer__title">STATS</div>
    <div class="footer__stats">
      <div class="footer__stat"><span class="l">CLICK</span><span class="v">{{ formatNumber(upgrades.getClickPower) }}</span></div>
      <div class="footer__stat"><span class="l">SPEED</span><span class="v">{{ formatNumber(upgrades.getSpeedMultiplier) }}×</span></div>
      <div class="footer__stat"><span class="l">O/CLK</span><span class="v">{{ formatNumber(machines.getMultiplier("slotBoost")) }}×</span></div>
      <div class="footer__stat"><span class="l">SELL</span><span class="v">{{ formatNumber(upgrades.getSellMultiplier) }}×</span></div>
      <div class="footer__stat"><span class="l">OUT+</span><span class="v">{{ formatNumber(upgrades.getPrestigeOutputBonus) }}×</span></div>
      <div class="footer__stat"><span class="l">OUT↑</span><span class="v">{{ formatNumber(machines.getMultiplier("outputBoost")) }}×</span></div>
      <div class="footer__stat"><span class="l">SYN</span><span class="v">{{ synergy.activeSynergies.length }}</span></div>
      <div class="footer__stat"><span class="l">PRG</span><span class="v">{{ game.canPrestige ? formatNumber(game.getPrestigeGain()) : "—" }}</span></div>
      <div class="footer__stat"><span class="l">OFFLN</span><span class="v">{{ formatOfflineCap(upgrades.getOfflineCap) }}</span></div>
    </div>
    <div class="footer__mark">CREATED BY MATES</div>
  </div>
</template>

<script setup lang="ts">
import { useUpgradeStore } from "@/stores/upgrade"
import { useMachineStore } from "@/stores/machine"
import { useSynergyStore } from "@/stores/synergy"
import { useGameStore } from "@/stores/game"
import { formatNumber } from "@/utils/format"

const upgrades = useUpgradeStore()
const machines = useMachineStore()
const synergy = useSynergyStore()
const game = useGameStore()

function formatOfflineCap(seconds: number): string {
  const hours = seconds / 3600
  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`
}
</script>

<style scoped lang="scss">
.footer {
  grid-area: stats;
  display: flex;
  align-items: stretch;
  border-top: 1px solid $border;
  background: linear-gradient(180deg, $surface 0%, $bg-2 100%);
}

.footer__title {
  display: flex;
  align-items: center;
  padding: 0 $s-6;
  border-right: 1px solid $border;
  font-family: $ff-display;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: .04em;
  color: $accent;
  background: rgba($accent, .06);
}

.footer__stats {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  align-items: center;
  padding: $s-3 $s-4;
  gap: $s-2;
  min-width: 0;
}

.footer__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  padding: 0 $s-3 0 0;
  border-right: 1px dashed rgba($ink, .08);
  min-width: 0;
  &:last-child { border-right: none; }
  .l { @include label(9px); }
  .v {
    font-family: $ff-display;
    font-weight: 700;
    font-size: 16px;
    color: $ink;
    line-height: 1;
    @include tab-nums;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }
}

.footer__mark {
  display: flex;
  align-items: center;
  padding: 0 $s-5;
  border-left: 1px solid $border;
  @include label(10px, $ink-3);
  background: rgba(#000, .15);
}

@media (max-width: 1024px) {
  .footer__title { padding: $s-3 $s-4; font-size: 14px; }
  .footer__stats { grid-template-columns: repeat(5, 1fr); }
  .footer__mark { display: none; }
}
@media (max-width: 768px) {
  .footer__stats { grid-template-columns: repeat(3, 1fr); }
}
</style>
