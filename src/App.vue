<template>
  <Login v-if="!user.loggedIn" @logged-in="onLoggedIn" />

  <template v-else>
    <div class="frame" :class="{ 'is-mobile': mobileLayout }">

      <Header />

      <Navbar v-if="!mobileLayout" />
      <button
        v-else
        class="mobile-menu-btn"
        @click="mobileMenuOpened = true"
        aria-label="Open menu"
      >
        <img src="/img/icons/Menu.svg" alt="">
      </button>

      <main class="main">
        <Simulation v-if="route.path === '/'" />
        <div v-else id="shop" class="shop"><router-view /></div>
      </main>

      <RightRail v-if="!mobileLayout" />

      <Stats />
    </div>

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
          <router-link to="/">FACTORY</router-link>
          <router-link to="/patterns">PATTERNS</router-link>
          <router-link to="/upgrades">UPGRADES</router-link>
          <router-link to="/synergies">SYNERGIES</router-link>
          <router-link to="/machines">MACHINES</router-link>
          <router-link to="/inventory">INVENTORY</router-link>
          <router-link to="/prestige">PRESTIGE</router-link>
          <router-link to="/leaderboard">RANKING</router-link>
        </nav>
      </div>
    </Transition>
  </template>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useWindowSize } from "@vueuse/core"
import { useSlotStore } from "@/stores/slot"
import { useUpgradeStore } from "@/stores/upgrade"
import { useGameStore } from "@/stores/game"
import { useUserStore } from "@/stores/user"
import { useBossStore } from "@/stores/boss"
import { loadGame, startAutoSave } from "@/utils/save"
import { startGameLoop } from "@/composables/gameLoop"
import { setBoostActive } from "@/utils/sound"

import Header from "@/components/game/Header.vue"
import Navbar from "@/components/game/Navbar.vue"
import Simulation from "@/components/game/Simulation.vue"
import Stats from "@/components/game/Stats.vue"
import RightRail from "@/components/game/RightRail.vue"
import Login from "./components/ui/Login.vue"
import BossFight from "@/components/ui/BossFight.vue"

const slotStore = useSlotStore()
const upgradeStore = useUpgradeStore()
const gameStore = useGameStore()
const user = useUserStore()
const bossStore = useBossStore()
const route = useRoute()

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

watch(
  () => slotStore.selectedSlotId,
  id => setBoostActive(id !== null)
)

async function initGame() {
  const lastPlayed = await loadGame()
  if (lastPlayed) {
    const now = Date.now()
    const rawDelta = (now - lastPlayed) / 1000
    const cap = upgradeStore.getOfflineCap
    const delta = Math.min(rawDelta, cap)
    slotStore.tick(delta)
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

async function onLoggedIn() {
  await initGame()
  startAutoSave()
}

onMounted(async () => {
  await user.restoreSession()
  if (user.loggedIn) {
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
#app {
  width: 100%;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: $s-5 0;
}

.frame {
  width: min($frame-w, calc(100vw - #{$s-5} * 2));
  height: min($frame-h, calc(100dvh - #{$s-5} * 2));
  display: grid;
  grid-template-columns: $nav-w 1fr $rail-w;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "stats  stats  stats";
  background: linear-gradient(180deg, $bg-2 0%, $bg 100%);
  border: 1px solid $border;
  border-radius: $r-xl;
  box-shadow: $shadow-3, 0 0 0 1px rgba($accent, .06);
  position: relative;
  overflow: hidden;
  isolation: isolate;

  &.is-mobile {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto;
    grid-template-areas:
      "header"
      "main"
      "aside"
      "stats";
    height: auto;
    min-height: 100dvh;
    border-radius: 0;
    border: none;
  }
}

.main {
  grid-area: main;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.shop {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: $s-5;
}

.mobile-menu-btn {
  position: fixed;
  top: $s-3;
  right: $s-3;
  z-index: 50;
  width: 44px;
  height: 44px;
  border-radius: $r-md;
  background: $surface-2;
  border: 1px solid $border;
  display: grid;
  place-items: center;
  img { width: 24px; filter: invert(1); }
}

.mobile-menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}
.mobile-menu {
  width: min(360px, 80vw);
  height: 100%;
  background: $bg;
  border-left: 1px solid $border;
  display: flex;
  flex-direction: column;
  padding: $s-5 0;

  a {
    padding: $s-4 $s-6;
    color: $ink;
    font-family: $ff-display;
    font-size: 22px;
    font-weight: 600;
    border-bottom: 1px solid $border;
    transition: background-color 0.2s, color 0.2s;
    &:hover, &.router-link-active {
      background-color: $accent-15;
      color: $accent;
    }
  }
}

.menu-fade-enter-active { transition: opacity 0.2s ease; .mobile-menu { transition: transform 0.25s ease; } }
.menu-fade-leave-active { transition: opacity 0.2s ease 0.05s; .mobile-menu { transition: transform 0.2s ease; } }
.menu-fade-enter-from, .menu-fade-leave-to {
  opacity: 0;
  .mobile-menu { transform: translateX(100%); }
}
</style>
