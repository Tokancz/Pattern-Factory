<template>
  <Login v-if="!user.loggedIn" @logged-in="onLoggedIn" />

  <template v-else>
    <header>
      <div>
        <h1>{{ user.user?.factoryName }}</h1>
        <p>{{ user.user?.username }}</p>
      </div>
      <ProgressBar v-if="!mobileLayout" :type="'level'" :length="15"/>
      <img
        v-if="mobileLayout"
        @click="mobileMenuOpened = true"
        src="/img/icons/Menu.svg"
        alt="Open menu"
        class="menu-icon"
      >
    </header>

    <CurrencyDisplay :show-level="mobileLayout" />

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

    <Navbar v-if="!mobileLayout" />

    <BossFight />

    <AfkReport :open="afkOpen" :report="afkReport" @close="afkOpen = false" />

    <!-- Mobile burger menu overlay -->
    <Transition name="menu-fade">
      <div
        v-if="mobileLayout && mobileMenuOpened"
        class="mobile-menu-overlay"
        @click.self="mobileMenuOpened = false"
      >
        <nav class="mobile-menu" @click="mobileMenuOpened = false">
          <router-link to="/patterns">PATTERNS</router-link>
          <router-link to="/upgrades">UPGRADES</router-link>
          <router-link to="/synergies">SYNERGIES</router-link>
          <router-link to="/machines">MACHINES</router-link>
          <router-link to="/inventory">INVENTORY</router-link>
          <router-link to="/prestige">PRESTIGE</router-link>
          <router-link to="/leaderboard">RANKING</router-link>

          <img src="/img/Stripes.png" alt="Stripes Background" aria-hidden="true" draggable="false">
        </nav>
      </div>
    </Transition>
  </template>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, reactive, watch } from "vue"
import { useWindowSize } from "@vueuse/core"
import { useSlotStore } from "@/stores/slot"
import { useUpgradeStore } from "@/stores/upgrade"
import { useGameStore } from "@/stores/game"
import { useUserStore } from "@/stores/user"
import { loadGame, startAutoSave } from "@/utils/save"
import { startGameLoop } from "@/composables/gameLoop"
import { setBoostActive } from "@/utils/sound"

import CurrencyDisplay from "@/components/ui/CurrencyDisplay.vue"
import ProgressBar from "@/components/ui/ProgressBar.vue"
import Simulation from "@/components/game/Simulation.vue"
import Stats from "./components/game/Stats.vue"
import Login from "./components/ui/Login.vue"
import Navbar from "./components/game/Navbar.vue"
import BossFight from "@/components/ui/BossFight.vue"
import AfkReport, { type AfkReportData } from "@/components/ui/AfkReport.vue"
import { useBossStore } from "@/stores/boss"

const slotStore = useSlotStore()
const upgradeStore = useUpgradeStore()
const gameStore = useGameStore()
const user = useUserStore()
const bossStore = useBossStore()

const afkOpen = ref(false)
const afkReport = reactive<AfkReportData>({
  awaySeconds: 0,
  cappedSeconds: 0,
  money: 0,
  dc: 0,
  exp: 0,
  prestigePoints: 0
})

const { width } = useWindowSize()
const mobileLayout = computed(() => width.value < 1024)
const mobileMenuOpened = ref(false)

// Boost loop plays while a slot is selected for targeted overclock.
watch(
  () => slotStore.selectedSlotId,
  id => setBoostActive(id !== null)
)

async function initGame() {
  const lastPlayed = await loadGame()

  if (!lastPlayed) return

  const now = Date.now()
  const rawDelta = (now - lastPlayed) / 1000
  if (rawDelta < 60) return // skip the popup for trivial gaps

  const cap = upgradeStore.getOfflineCap
  const delta = Math.min(rawDelta, cap)
  const cappedSeconds = Math.max(0, rawDelta - cap)

  // Snapshot currencies, simulate the slots forward, then diff to figure
  // out what was earned while AFK so we can scale it by the offlineGain
  // multiplier and present a report to the user.
  const before = {
    money: gameStore.money,
    dc: gameStore.dc,
    exp: gameStore.exp,
    level: gameStore.level,
    pp: gameStore.prestigePoints
  }

  slotStore.tick(delta)

  const mult = upgradeStore.getOfflineGainMultiplier
  const bonus = mult - 1
  if (bonus > 0) {
    const moneyGained = gameStore.money - before.money
    const dcGained    = gameStore.dc - before.dc
    if (moneyGained > 0) gameStore.addMoney(moneyGained * bonus)
    if (dcGained > 0)    gameStore.addDC(dcGained * bonus)
  }

  // Recompute final deltas after the bonus was applied. EXP is tricky
  // because tick() can level up — convert level diff back into total exp.
  const expGainedTotal = totalExpDelta(before.level, before.exp, gameStore.level, gameStore.exp)

  afkReport.awaySeconds   = rawDelta
  afkReport.cappedSeconds = cappedSeconds
  afkReport.money         = Math.max(0, gameStore.money - before.money)
  afkReport.dc            = Math.max(0, gameStore.dc - before.dc)
  afkReport.exp           = Math.max(0, expGainedTotal)
  afkReport.prestigePoints = Math.max(0, gameStore.prestigePoints - before.pp)

  if (afkReport.money + afkReport.dc + afkReport.exp + afkReport.prestigePoints > 0) {
    afkOpen.value = true
  }
}

// Sum the exp the player accumulated even if they leveled up one or more
// times during the offline tick. We can't ask the store for "total exp"
// because each level resets the running counter.
function totalExpDelta(beforeLevel: number, beforeExp: number, afterLevel: number, afterExp: number): number {
  if (afterLevel === beforeLevel) return afterExp - beforeExp
  let sum = -beforeExp
  for (let lvl = beforeLevel; lvl < afterLevel; lvl++) {
    sum += Math.floor(100 * Math.pow(1.2, lvl))
  }
  sum += afterExp
  return sum
}

// Called when user logs in via the Login form
async function onLoggedIn() {
  await initGame()
  startAutoSave()
}

onMounted(async () => {
  // Restore session (JWT still valid from previous visit)
  await user.restoreSession()

  if (user.loggedIn) {
    // Pull fresh save from DB — this is the source of truth
    await initGame()
    // Only start the autosave loop AFTER the load is done. Otherwise the
    // 5s interval can fire mid-load and PUT the default empty state.
    startAutoSave()
  }

  startGameLoop()
  bossStore.start()
})
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
    max-height: none;
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto 1fr;
    grid-template-areas:
      "header"
      "currency"
      "main"
      "aside";
    font-size: .75em;
  }

  @media (width <= 480px) {
    font-size: .65em;
  }

  > header {
    height: 100px;

    @include flexRow(0, space-between);
    padding: 0 40px 0 20px;
    grid-area: header;
    font-weight: bold;
    color: var(--primary);

    @media (width < 1024px) {
      padding: 0 16px;
      height: 64px;
    }

    div {
      @include flexColumn(0, center, start);
      line-height: 1.1;

      h1 {
        font-size: 3em;
        text-decoration: underline;

        @media (width < 1024px) {
          font-size: 2.5em;
        }
      }
      p {
        font-size: 1.25em;
        text-decoration: underline;

        @media (width < 1024px) {
          font-size: 1.5em;
        }
      }
    }

    img.menu-icon {
      width: 48px;
      user-select: none;
      cursor: pointer;

      @media (width < 1024px) {
        width: 36px;
      }
    }
  }

  main {
    grid-area: main;

    display: grid;
    grid-template-rows: 3fr auto 1fr 40px;
    grid-template-areas:
      "patterns"
      "shop"
      "stats"
      "footer";

    @media (width < 1024px) {
      grid-template-rows: repeat(4, auto);
    }

    #shop {
      grid-area: shop;
      overflow: hidden;
    }

    footer {
      grid-area: footer;
      @include flexRow(30px, center, center);
      padding: 5px 0;

      > p {
        font-size: 1.25em;
      }
    }
  }
}

/* Mobile burger menu overlay */
.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  z-index: 100;
  @include flexRow(0, flex-end, stretch);
}

.mobile-menu {
  width: min(400px, 80vw);
  height: 100%;
  background-color: var(--black);
  @include flexColumn(0, start, stretch);
  padding: 20px 0;

  a {
    display: block;
    padding: 20px 24px;
    color: var(--primary);
    font-family: "ivy-presto";
    font-size: 4em;
    text-decoration: none;
    border-bottom: 2px solid var(--primary);
    transition: background-color 0.2s;

    &:hover,
    &.router-link-active {
      background-color: var(--primary);
      color: var(--black);
    }
  }
  img {
    height: 100%;
  }
}

/* Slide-in transition */
.menu-fade-enter-active {
  transition: opacity 0.2s ease;
  .mobile-menu {
    transition: transform 0.25s ease;
  }
}
.menu-fade-leave-active {
  transition: opacity 0.2s ease 0.05s;
  .mobile-menu {
    transition: transform 0.2s ease;
  }
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  .mobile-menu {
    transform: translateX(100%);
  }
}
</style>