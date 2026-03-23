<template>
  <header>
    <div>
      <h1>Factory Name</h1>
      <p>Username</p>
    </div>
    <ProgressBar :prefix="'LVL'" :length="10"/>
  </header>
  <CurrencyDisplay />
  <main>
    <Simulation />
    <div class="panels">
      <router-view />
    </div>
    <div id="stats"></div>
    <ProgressBar :prefix="'CREATING PART'"/>
  </main>
  <aside>
    <nav>
      <li><router-link to="/Pattern-Factory/patterns">PATTERNS</router-link></li>
      <li><router-link to="/Pattern-Factory/upgrades">UPGRADES</router-link></li>
      <li><router-link to="/Pattern-Factory/machines">MACHINES</router-link></li>
      <li><router-link to="/Pattern-Factory/inventory">INVENTORY</router-link></li>
      <li><router-link to="/Pattern-Factory/prestige">PRESTIGE</router-link></li>
    </nav>
    <img src="/img/Stripes.png" alt="Stripes Background" aria-hidden="true">
  </aside>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useSlotStore } from "@/stores/slot"

import CurrencyDisplay from "@/components/ui/CurrencyDisplay.vue"
import ProgressBar from "@/components/ui/ProgressBar.vue"
import Simulation from "@/components/game/Simulation.vue"

const slots = useSlotStore()

const shop = ref('pattern')

onMounted(() => {
  let last = performance.now()

  function loop(now: number) {
    const delta = (now - last) / 1000
    last = now

    slots.tick(delta)

    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
})
</script>

<style lang="scss">
div#app {
  height: 100dvh;
  width: 100%;
  max-height: 1024px;
  max-width: 1440px;

  display: grid;
  grid-template-columns: 8fr 4fr;
  grid-template-rows: 1fr 9fr;
  grid-template-areas: 
  "header currency"
  "main aside";

  overflow: hidden;

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
    grid-template-rows: 3fr 4fr 1fr 1fr;
    grid-template-areas: 
    "patterns"
    "shop"
    "stats"
    "footer";

    .panels {
      grid-area: shop;
      width: 100%;
    }
    #stats {
      grid-area: stats;
      background-color: var(--primary);
    }
  }
  aside {
    height: calc(100dvh - 100px);
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
      width: 100%;
    }
  }
}

</style>