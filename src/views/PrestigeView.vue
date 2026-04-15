<template>
  <Panel title="Prestige">
    <div class="prestige">
      <div class="text-container">
        <p>Reset your run at <strong>1,000,000 IGM</strong> to earn Prestige Points.</p>
        <p>PP survives resets and unlocks permanent upgrades.</p>
        <p id="gain">
          Current PP Gain: <strong>{{ game.getPrestigeGain() }}</strong> PP
        </p>
        <p id="current-pp">
          You have: <strong>{{ formatNumber(game.prestigePoints) }}</strong> PP
        </p>
      </div>

      <div class="prestige-container">
        <button
          @click="prestige"
          :disabled="!game.canPrestige"
          class="prestige-button"
          :class="{ ready: game.canPrestige }"
        >
          <img src="/img/icons/connectdevelop.svg" alt="">
          <p>PRESTIGE</p>
        </button>
        <p v-if="!game.canPrestige" class="requirement">
          Need {{ formatNumber(1_000_000) }} IGM
        </p>
      </div>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { useGameStore } from "@/stores/game"
import { formatNumber } from "@/utils/format"

const game = useGameStore()
const prestige = game.prestige
</script>

<style scoped lang="scss">
.prestige {
  grid-column: 1 / span 4;
  @include flexRow(50px, center, center);
  font-size: 1.5em;
  padding: 50px 0;

  .text-container {
    @include flexColumn(8px, center, start);
    max-width: 60%;

    p#gain {
      font-size: .85em;
      color: var(--secondary);
      margin-top: 8px;
    }
    p#current-pp {
      font-size: .85em;
      color: var(--white);
      opacity: 0.7;
    }
    .requirement {
      font-size: 0.7em;
      color: var(--secondary);
    }
  }

  .prestige-container {
    @include flexColumn(12px, center, center);

    .prestige-button {
      width: 200px;
      @include flexColumn(10px, center, center);
      padding: 10px 20px;
      border-radius: 5px;
      font-weight: bold;
      opacity: 0.4;
      cursor: not-allowed;
      transition: .3s;

      img { width: 80px; }

      &.ready {
        opacity: 1;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(192, 254, 4, 0.4);

        &:hover {
          background-color: var(--primary);
          transform: scale(1.05);
        }
      }
    }

    > p.requirement {
      font-size: .7em;
    }
  }
}
</style>