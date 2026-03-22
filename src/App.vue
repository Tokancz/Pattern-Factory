<template>
  <header>
    <div>
      <h1>Factory Name</h1>
      <p>Username</p>
    </div>
    <ProgressBar />
  </header>
  <CurrencyDisplay />
  <main>
    <div id="patterns"></div>
    <div id="upgrades"></div>
    <div id="stats"></div>
    <ProgressBar />
  </main>
  <aside>
    <nav>
      <li @click.prevent="">PATTERNS</li>
      <li @click.prevent="">UPGRADES</li>
      <li @click.prevent="">MACHINES</li>
      <li @click.prevent="">INVENTORY</li>
      <li @click.prevent="">PRESTIGE</li>
    </nav>
    <img src="/public/img/Stripes.png" alt="Stripes Background" aria-hidden="true">
  </aside>
</template>

<script setup lang="ts">
import { onMounted } from "vue"
import { useProgressStore } from "@/stores/useProgressStore"

import CurrencyDisplay from "@/components/ui/CurrencyDisplay.vue"
import ProgressBar from "@/components/ui/ProgressBar.vue"

const progress = useProgressStore()

onMounted(() => {
  let last = performance.now()

  function loop(now: number) {
    const delta = (now - last) / 1000
    last = now

    progress.tick(delta)

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

    .patterns {
      grid-area: patterns;
    }
    .shop {
      grid-area: shop;
    }
    .stats {
      grid-area: stats;
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

        font-family: "ivy-presto";
        font-size: 4em;
        text-decoration: none;
        text-align: end;
        list-style: none;
        color: var(--primary);
        border-bottom: 2px solid var(--primary);
        border-top: 2px solid var(--primary);

        padding: 0 20px;
        cursor: pointer;
        transition: .3s;

        &:hover {
          background-color: var(--primary);
          color: var(--black);
        }
      }
    }
    img {
      width: 100%;
    }
  }
}

</style>