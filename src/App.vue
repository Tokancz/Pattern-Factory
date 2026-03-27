<template>
  <Login v-if="!user.loggedIn" />

  <template v-else>
    <header>
      <div>
        <h1>{{ user.factoryName }}</h1>
        <p>{{ user.username }}</p>
      </div>
      <ProgressBar :type="'level'" :length="15"/>
      <img v-if="mobileLayout" @click="mobileMenuOpened = true" src="/img/icons/Menu.svg" alt="Menu Icon" aria-hidden="true" class="menu-icon">
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
    <Navbar v-if="!mobileLayout"/>
  </template>
</template>

<script setup lang="ts">
import { onMounted, computed, ref} from "vue"
import { useWindowSize } from "@vueuse/core"
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
import Navbar from "./components/game/Navbar.vue"

const slotStore = useSlotStore()
const upgradeStore = useUpgradeStore()
const user = useUserStore()

const { width } = useWindowSize()
const mobileLayout = computed(() => width.value < 1024)
const mobileMenuOpened = ref(false)

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

  @media (width <= 1200px) {
    font-size: .8em;
  }
  @media (width < 1024px) {
    grid-template-columns: 1fr;
    grid-template-rows: 100px 1fr 1fr 200px;
    grid-template-areas: 
    "header"
    "currency"
    "main"
    "aside";
  }

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
    img.menu-icon {
      width: 48px;
      user-select: none;
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
}

</style>