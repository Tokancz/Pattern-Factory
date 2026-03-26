<template>
  <Login v-if="!user.loggedIn" />

  <template v-else>
    <header>
      <div>
        <h1>{{ user.factoryName }}</h1>
        <p>{{ user.username }}</p>
      </div>
      <ProgressBar :type="'level'" :length="15"/>
    </header>

    <CurrencyDisplay />

    <main>
      <Simulation />
      <div id="shop">
        <router-view />
      </div>
      <Stats />
      <footer>
        <p>Created by Mates</p>
      </footer>
    </main>

    <aside>
      <nav>
        <li><router-link to="/Pattern-Factory/patterns">PATTERNS</router-link></li>
        <li><router-link to="/Pattern-Factory/upgrades">UPGRADES</router-link></li>
        <li><router-link to="/Pattern-Factory/machines">MACHINES</router-link></li>
        <li><router-link to="/Pattern-Factory/inventory">INVENTORY</router-link></li>
        <li><router-link to="/Pattern-Factory/prestige">PRESTIGE</router-link></li>
      </nav>
      <img src="/img/Stripes.png" alt="Stripes Background" aria-hidden="true" draggable="false">
    </aside>
  </template>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import { useSlotStore } from "@/stores/slot"
import { useUpgradeStore } from "@/stores/upgrade"
import { useUserStore } from "@/stores/user"
import { loadGame, startAutoSave } from "@/utils/save"
import { startGameLoop } from "@/composables/gameLoop"

import CurrencyDisplay from "@/components/ui/CurrencyDisplay.vue"
import ProgressBar from "@/components/ui/ProgressBar.vue"
import Simulation from "@/components/game/Simulation.vue"
import Stats from "./components/game/Stats.vue"
import Login from "./components/ui/Login.vue"

const slotStore = useSlotStore()
const upgradeStore = useUpgradeStore()
const user = useUserStore()

onMounted(() => {
  const data = loadGame()

  if (data) {
    const now = Date.now()
    const rawDelta = (now - data.timestamp) / 1000
    const cap = upgradeStore.getOfflineCap
    const delta = Math.min(rawDelta, cap)
    slotStore.tick(delta)
  }

  startAutoSave()
  startGameLoop()
})

//todo:
</script>

<style lang="scss">
div#app {
  height: 100dvh;
  width: 100%;
  max-height: 1024px;
  max-width: 1440px;

  display: grid;
  grid-template-columns: 10fr 4fr;
  grid-template-rows: 1fr 9fr;
  grid-template-areas: 
  "header currency"
  "main aside";

  //overflow: hidden;

  header {
    height: 100px;

    @include flexRow(0, space-between);
    
    padding: 0 40px 0 20px;
    grid-area: header;
    font-weight: bold;
    color: var(--primary);

    div {
      @include flexColumn(0, center, start );
      line-height: 1.1;
      

      h1 {
        font-size: 3em;
        text-decoration: underline;
      }
      p {
        font-size: 1.25em;
        text-decoration: underline;
      }
    }
  }
  main {
    grid-area: main;

    display: grid;
    grid-template-rows: 3fr 4fr 1fr 40px;
    grid-template-areas: 
    "patterns"
    "shop"
    "stats"
    "footer";

    #shop {
      grid-area: shop;
    }
    footer {
      grid-area: footer;
      @include flexRow(30px, center, center);
      > p {
        font-size: 0.9em;
      }
    }
  }
  aside {
    //height: calc(100dvh - 100px);
    grid-area: aside;

    display: grid;
    grid-template-rows: 6fr 3fr;
    grid-template-areas: 
    "nav"
    "img";
    overflow: hidden;

    nav {
      grid-area: nav;
      @include flexColumn(0, space-around);

      li {
        width: 100%;
        height: 100%;

        @include flexRow(0, center, center);

        border-bottom: 2px solid var(--primary);
        border-top: 2px solid var(--primary);
        text-align: end;

        padding: 0 20px;
        cursor: pointer;
        user-select: none;
        transition: .3s;

        &:hover {
          background-color: var(--primary);
          color: var(--black);
        }
        &:hover a {
          color: var(--black);
        }
        a {
          display: block;
          width: 100%;
          color: var(--primary);
          font-family: "ivy-presto";
          font-size: 4em;
          text-decoration: none;
          list-style: none;
        }
      }
    }
    img {
      height: 100%;
      user-select: none;
    }
  }
}

</style>