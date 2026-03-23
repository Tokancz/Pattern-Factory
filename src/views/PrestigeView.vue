<template>
  <Panel title="Prestige">
    <div class="prestige">
      
      <p>After you reach 1t IGM you can prestige for permanent income increase by resetting your progress.</p>
      
      <div class="prestige-container">

        <button @click="prestige" class="prestige-button">
          <img src="/img/icons/connectdevelop.svg" alt="">
          <p>PRESTIGE</p>
        </button>

        <p>Prestige Points: {{ game.prestigePoints }}</p>
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

  > p {
    max-width: 60%;
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
  }
}
</style>