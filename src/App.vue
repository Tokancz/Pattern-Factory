<template>
  <Login v-if="!user.loggedIn" />
  <div v-else-if="!gameReady" class="boot-splash" role="status" aria-live="polite">
    <p>Loading the Engine…</p>
  </div>

  <template v-else>
    <header>
      <div>
        <h1>{{ user.user?.factoryName }}</h1>
        <p>
          <span class="architect-title">{{ architectTitle(glyphStore.ascensionCount, glyphStore.isStabilized) }}</span>
          {{ user.user?.username }}
        </p>
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
        <router-view v-slot="{ Component }">
          <Transition name="route-fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </div>
      <Stats />
      <footer>
        <p>Created by Mates</p>
      </footer>
    </main>

    <Navbar v-if="!mobileLayout" />

    <BossFight />

    <AfkReport :open="afkOpen" :report="afkReport" @close="afkOpen = false" />

    <IntroOverlay
      :open="introOpen"
      @close="closeIntro"
      @open-tutorial="openTutorial"
    />

    <ChoiceOverlay
      :open="choiceOpen"
      @stabilize="onStabilize"
    />

    <CreditsOverlay
      :open="creditsOpen"
      @close="creditsOpen = false"
    />

    <!-- Mobile burger menu overlay -->
    <Transition name="menu-fade">
      <div
        v-if="mobileLayout && mobileMenuOpened"
        class="mobile-menu-overlay"
        @click.self="mobileMenuOpened = false"
      >
        <nav class="mobile-menu" @click="mobileMenuOpened = false">
          <router-link to="/patterns">PATTERNS</router-link>
          <router-link to="/upgrades">PROTOCOLS</router-link>
          <router-link to="/synergies">RESONANCES</router-link>
          <router-link to="/machines">MODULES</router-link>
          <router-link to="/inventory">ARCHIVE</router-link>
          <router-link to="/glyphs">GLYPHS</router-link>
          <router-link to="/prestige">RECURSION</router-link>
          <router-link to="/leaderboard">REGISTRY</router-link>

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
import { useGlyphStore } from "@/stores/glyph"
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
import IntroOverlay  from "@/components/ui/IntroOverlay.vue"
import ChoiceOverlay  from "@/components/ui/ChoiceOverlay.vue"
import CreditsOverlay from "@/components/ui/CreditsOverlay.vue"
import { openTutorial } from "@/composables/tutorial"
import { architectTitle } from "@/utils/architect"
import { useBossStore } from "@/stores/boss"

const slotStore = useSlotStore()
const upgradeStore = useUpgradeStore()
const gameStore = useGameStore()
const user = useUserStore()
const glyphStore = useGlyphStore()
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

const introOpen   = ref(false)
const choiceOpen  = ref(false)
const creditsOpen = ref(false)

// Gates the main UI until loadGame() has populated the stores. Without
// this, flipping user.loggedIn = true inside register()/login() makes
// Vue paint the main view with default 0 values before /save resolves —
// users perceive that as "the DB only loads after a refresh."
const gameReady = ref(false)
let autoSaveStarted = false

function maybeShowIntro() {
  if (!glyphStore.seenIntro) introOpen.value = true
}

function closeIntro() {
  glyphStore.setSeenIntro(true)
  introOpen.value = false
}

// The Architect's Choice: surfaces the Stabilize / Compile modal once
// the player produces ENDGAME_GLYPH_PATTERN_THRESHOLD Γ patterns AND
// owns Final Pattern. Once they pick Stabilize, the choice modal closes
// and the credits roll. Already-stabilized accounts never re-trigger.
watch(
  () => glyphStore.endgameAvailable,
  available => { if (available) choiceOpen.value = true }
)

function onStabilize() {
  glyphStore.stabilize()
  choiceOpen.value  = false
  creditsOpen.value = true
}

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
    pp: gameStore.pendingPrestigePoints
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
  afkReport.prestigePoints = Math.max(0, gameStore.pendingPrestigePoints - before.pp)

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

// Single boot path used by both restoreSession on mount and the
// post-login/register transition. The watcher below covers the latter
// so we don't rely on a child emit reaching the parent during the same
// tick Login unmounts in. bootPromise dedupes the two callers that
// would otherwise both fire after restoreSession() flips loggedIn.
let bootPromise: Promise<void> | null = null
function bootGame(): Promise<void> {
  if (gameReady.value) return Promise.resolve()
  if (bootPromise) return bootPromise
  bootPromise = (async () => {
    try {
      await initGame()
      if (!autoSaveStarted) {
        startAutoSave()
        autoSaveStarted = true
      }
      maybeShowIntro()
      gameReady.value = true
    } finally {
      bootPromise = null
    }
  })()
  return bootPromise
}

watch(() => user.loggedIn, async loggedIn => {
  if (loggedIn) await bootGame()
  else {
    gameReady.value = false
  }
})

onMounted(async () => {
  // Restore session (JWT still valid from previous visit)
  await user.restoreSession()

  if (user.loggedIn) await bootGame()

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

  @include bp("xl") { font-size: .8em; }
  @include bp-below("lg") {
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
  @include bp("sm") { font-size: .65em; }

  // ─── Large-display scaling ──────────────────────────────────────────────
  // Above the legacy 1440×1024 design footprint, lift the hard cap and
  // resize the app to fill the screen while maintaining the design's
  // 1.40625:1 aspect ratio. font-size scales with viewport so every em-
  // based dimension (paddings, gaps, icons, currency bar) grows with the
  // app — without this, the layout sits in a 1440px letterbox on 4K /
  // ultrawide monitors.
  @media (min-width: 1441px) and (min-height: 1025px) {
    max-width: none;
    max-height: none;
    width:  min(100vw, calc(100dvh * 1.40625));
    height: min(100dvh, calc(100vw  / 1.40625));
    // Floor at 1rem so we never shrink below the design baseline; cap at
    // 1.75rem so 8K monitors don't render absurdly large.
    font-size: clamp(1rem, 1.05vw, 1.75rem);
  }

  > header {
    height: 100px;

    @include flexRow(0, space-between);
    padding: 0 40px 0 20px;
    grid-area: header;
    font-weight: bold;
    color: var(--primary);

    @include bp-below("lg") { padding: 0 16px; height: 64px; }

    div {
      @include flexColumn(0, center, start);
      line-height: 1.1;

      h1 {
        font-size: 3em;
        text-decoration: underline;

        @include bp-below("lg") { font-size: 2.5em; }
      }
      p {
        font-size: 1.25em;
        text-decoration: underline;

        @include bp-below("lg") { font-size: 1.5em; }

        .architect-title {
          display: inline-block;
          margin-right: 6px;
          padding: 1px 6px;
          font-size: .7em;
          letter-spacing: 0.1em;
          color: var(--black);
          background: var(--primary);
          text-decoration: none;
          vertical-align: middle;
          text-transform: uppercase;
        }
      }
    }

    img.menu-icon {
      width: 48px;
      user-select: none;
      cursor: pointer;

      @include bp-below("lg") { width: 36px; }
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

    @include bp-below("lg") { grid-template-rows: repeat(4, auto); }

    #shop {
      grid-area: shop;
      overflow: hidden;
    }

    footer {
      grid-area: footer;
      @include flexRow(30px, center, center);
      padding: 5px 0;

      > p { font-size: 1.25em; }
    }
  }
}

.boot-splash {
  position: fixed;
  inset: 0;
  background-color: var(--black);
  color: var(--primary);
  @include flexRow(0, center, center);
  font-size: 1.5em;
  letter-spacing: 0.1em;
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

    @include bp("sm") { font-size: 3em; padding: 14px 18px; }
  }
  img { height: 100%; }
}

/* Slide-in transition */
.menu-fade-enter-active {
  transition: opacity 0.2s ease;
  .mobile-menu { transition: transform 0.25s ease; }
}
.menu-fade-leave-active {
  transition: opacity 0.2s ease 0.05s;
  .mobile-menu { transition: transform 0.2s ease; }
}
.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  .mobile-menu { transform: translateX(100%); }
}
</style>