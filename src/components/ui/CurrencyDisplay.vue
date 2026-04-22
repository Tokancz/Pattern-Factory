<template>
  <div class="currency" role="status" aria-label="Currency totals">
    <p v-if="showLevel" class="level-display">
      LVL.{{ game.level }}
      <span class="level-bar" aria-hidden="true">{{ levelBar }}</span>
    </p>
    <p><abbr title="In-Game Money">IGM</abbr> {{ formatNumber(game.money) }}</p>
    <p><abbr title="Dark Coins">DC</abbr> {{ formatNumber(game.dc) }}</p>
    <p><abbr title="Prestige Points">PP</abbr> {{ formatNumber(game.prestigePoints) }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useGameStore } from "@/stores/game"
import { formatNumber } from "@/utils/format"
import { generateBar } from "@/utils/ascii"

const props = defineProps<{
  showLevel?: boolean
}>()

const game = useGameStore()

const levelBar = computed(() =>
  generateBar(game.exp, game.expToNextLevel, 8)
)
</script>

<style lang="scss">
.currency {
  grid-area: currency;

  @include flexRow(0, space-between);

  background-color: var(--primary);
  color: var(--black);

  p {
    @include flexColumn(2px, center, center);
    height: 100%;
    padding: 5px 8px;
    flex: 1;
    border-right: 2px solid var(--black);
    text-align: center;
    font-size: .9em;

    &:last-child {
      border-right: none;
    }

    &.level-display {
      @include flexColumn(2px, center, center);
      font-weight: bold;
      flex: 1.4;
    }

    .level-bar {
      font-size: .75em;
      opacity: .75;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
  }
}
</style>