<template>
  <Panel title="Prestige">
    <div class="prestige">

      <div class="text-container">
        <p>After you reach 1t IGM you can prestige for permanent income increase by resetting your progress.</p>
        <p id="gain">Current Prestige Gain: {{ game.getPrestigeGain() }}</p>
      </div>
      
      <div class="prestige-container">

        <button @click="prestige" :disabled="!game.canPrestige" class="prestige-button">
          <img src="/img/icons/connectdevelop.svg" alt="">
          <p>PRESTIGE</p>
        </button>
      </div>
      
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { useGameStore } from "@/stores/game"

const game = useGameStore()

const prestige = game.prestige
</script>

<style scoped lang="scss">
.prestige {
  grid-column: 1 / span 4 ;

  @include flexRow(50px, center, center);
  
  font-size: 1.5em;

  .text-container {
    @include flexColumn(20px, center, start);
    max-width: 60%;

    p#gain {
      font-size: .8em;
      color: var(--secondary);
    }
  }
  .prestige-container {
    @include flexColumn(20px, center, center);

    .prestige-button {
      width: 200px;
      
      @include flexColumn(10px, center, center);
      
      padding: 10px 20px;
      border-radius: 5px;
      font-weight: bold;

      img {
        width: 80px;
      }
    }

    >p {
      font-size: .8em;
      color: var(--secondary);
    }
  }
}
</style>