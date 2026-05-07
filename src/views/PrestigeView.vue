<template>
  <Panel title="Recursion">
    <div class="prestige">
      <div class="text-container">
        <p>Re-render this layer of reality. Pending PP banks into spendable Persistence Points.</p>
        <p>Crosses generate <strong>Pending PP</strong> while the engine runs — it inscribes only when you re-render.</p>
        <p>Re-rendering at <strong>1,000,000 IGM</strong> grants bonus PP from accumulated mass.</p>
        <p id="pending-pp">
          Pending PP: <strong>{{ formatNumber(Math.floor(game.pendingPrestigePoints)) }}</strong>
        </p>
        <p id="money-gain">
          Bonus from mass: <strong>{{ game.getMoneyPrestigeGain() }}</strong> PP
        </p>
        <p id="gain">
          Total on re-render: <strong>{{ game.getPrestigeGain() }}</strong> PP
        </p>
        <p id="current-pp">
          You have: <strong>{{ formatNumber(game.prestigePoints) }}</strong> PP
        </p>
      </div>

      <div class="prestige-container">
        <button
          type="button"
          @click="prestige"
          :disabled="!game.canPrestige"
          class="prestige-button"
          :class="{ ready: game.canPrestige }"
          :aria-label="game.canPrestige ? 'Re-render — collapse this run and bank ' + game.getPrestigeGain() + ' PP' : 'Re-render locked — need 1,000,000 IGM or pending PP'"
        >
          <img src="/img/icons/connectdevelop.svg" alt="" aria-hidden="true">
          <p aria-hidden="true">RE-RENDER</p>
        </button>
        <p v-if="!game.canPrestige" class="requirement">
          Need {{ formatNumber(1_000_000) }} IGM or pending PP
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
  font-size: 1.3em;
  padding: 20px 0;

  @include bp("md") {
    flex-direction: column;
    gap: 24px;
    font-size: 1.1em;
    padding: 16px 8px;
  }

  .text-container {
    @include flexColumn(8px, center, start);
    max-width: 60%;

    @include bp("md") { max-width: 100%; }

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
      @include flexColumn(10px, center, center);
      width: 200px;
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

    > p.requirement { font-size: .7em; }
  }
}
</style>