<template>
  <Login v-if="!isNameSet" />

  <HeaderBar v-if="isNameSet"
    :gainedMoney="gainedMoney"
    :lvlPopUp="lvlPopUp"
    :mobileMenu="mobileMenu"
    :openedShop="openedShop"
    :formatNumber="formatNumber"
    @openMenu="mobileMenu = true"
  />
  <main v-if="isNameSet">
    <StatsAside
      v-if="!mobileMenu"
      :incomePerSecond="formatNumber( Math.floor(incomePerSecond * 100) / 100 )"
      :idleIncomePerSecond="formatNumber( Math.floor(idleIncomePerSecond * 100) / 100 )"
      :creatingProgress="creatingProgress"
      :currentPattern="currentPattern"
      :displayValue="displayValue"
      :shapes="shapes"
    />

    <FactorySimulation
      :machines="machines"
      :parts="parts"
      :shapes="shapes"
      :currentPattern="currentPattern"
      :creatingProgress="creatingProgress"
      @clickFactory="click"
      :machinePos="machinePos"
      :partStyle="partStyle"
    />

    <!-- SHOP MENU -->
    <section id="shopList">
      <img src="/img/Shop.png" draggable="false" />
      <aside>
        <div class="shop_header">
          <h2>SHOP</h2>
          <img src="/img/ShoppingCart.png" draggable="false" />
        </div>

        <div class="shop_buttons">
          <button class="button" @click="openedShop = 'patterns'">Patterns</button>
          <button class="button" @click="openedShop = 'machines'">Machines</button>
          <button class="button" @click="openedShop = 'upgrades'">Upgrades</button>
          <button class="button" @click="openedShop = 'prestige'">Prestige</button>
          <button class="button" @click="openedShop = 'inventory'">Inventory</button>
        </div>
      </aside>
    </section>

    <!-- UNIVERSAL SHOP TAB -->
    <section class="tab" v-if="shopConfig">
      <div class="shop_header">
        <h4>{{ shopConfig.title }}</h4>
        <p @click="openedShop = ''">X</p>
      </div>

      <div class="container">
        <ShopCard
          v-for="item in shopConfig.items"
          :key="getItemKey(item)"
          :type="shopConfig.type"
          :data="item"
          :shapes="shapes"
          :formatNumber="formatNumber"
          :displayValue="displayValue"
          @buy="(val) => shopConfig!.action(val)"
          @select="(val) => shopConfig!.action(val)"
          @prestige="() => shopConfig!.action()"
          v-show="shopConfig.filter ? shopConfig.filter(item) : true"
        />
      </div>
    </section>

    <!-- MOBILE MENU -->
    <section id="mobileMenu" v-if="mobileMenu">
      <img src="/img/Shop.png" draggable="false" />
      <aside>
        <div class="shop_header">
          <h2>MENU</h2>
          <i @click="mobileMenu = false" class="fa-solid fa-chevron-up"></i>
        </div>

        <div class="shop_buttons">
          <button @click="mobileOpen('patterns')">Patterns</button>
          <button @click="mobileOpen('machines')">Machines</button>
          <button @click="mobileOpen('upgrades')">Upgrades</button>
          <button @click="mobileOpen('prestige')">Prestige</button>
          <button @click="mobileOpen('inventory')">Inventory</button>
        </div>
      </aside>
    </section>

    <!-- OFFLINE REWARD -->
    <div v-if="showOfflinePopup" id="offlineReward">
      <p @click="closeOfflinePopup">X</p>
      <h3>Welcome back!</h3>
      <p>You earned {{ formatNumber(offlineReward) }} IGM</p>
    </div>
  </main>
  <CurrencyBar :money="formatNumber(money)" :dc="formatNumber(dc)" v-if="isNameSet" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import { gameStore, isNameSet } from "@/stores/useGameStore"

import { useGameState } from "@/composables/useGameState"
import { usePatterns } from "@/composables/usePatterns"
import { useFactory } from "@/composables/useFactory"
import { usePrestige } from "@/composables/usePrestige"
import { useOffline } from "@/composables/useOffline"
import { useSaveSystem } from "@/composables/useSaveSystem"

import HeaderBar from "@/components/HeaderBar.vue"
import FactorySimulation from "@/components/FactorySimulation.vue"
import ShopCard from "@/components/ShopCard.vue"
import CurrencyBar from "@/components/CurrencyBar.vue"
import Login from "@/components/Login.vue"
import StatsAside from "@/components/StatsAside.vue"

import type { Pattern } from "@/types/Pattern"
import type { Upgrades } from "@/types/Upgrade"

// ---------- TYPES ----------
type ShopType =
  | "patterns"
  | "machines"
  | "upgrades"
  | "inventory"
  | "prestige"

// ---------- COLORS ----------
const colors = {
  gray: "#cdcdcd",
  red: "#ff4d4d",
  blue: "#85a7ff",
  green: "#4ddf88",
  yellow: "#ffd972",
  purple: "#9858ed",
  cyan: "#4dd2df",
} as const

// ---------- GAME STATE ----------
const { money, dc, upgrades } = gameStore
const { gainExp, formatNumber } = useGameState()

// ---------- PATTERNS ----------
const {
  patterns,
  patternList,
  ownedPatterns,
  currentPattern,
  setPattern,
  buyPattern,
  displayValue,
  shapes,
} = usePatterns(colors)

// ---------- FACTORY ----------
const {
  machines,
  parts,
  creatingProgress,
  click,
  startFactoryLoop,
  machinePos,
  partStyle,
} = useFactory(gainExp, colors)

// ---------- PRESTIGE ----------
const { prestige, calculatePrestigeReward } = usePrestige(
  patterns,
  ref([]),
  parts,
  creatingProgress
)

// ---------- OFFLINE ----------
const { showOfflinePopup, offlineReward, applyOfflineProgress, closeOfflinePopup, idleIncomePerSecond, incomePerSecond } =
  useOffline()

const { saveGame, loadGame } = useSaveSystem()

// ---------- UI STATE ----------
const gainedMoney = ref(0)
const lvlPopUp = ref(false)
const openedShop = ref("")
const mobileMenu = ref(false)

// ---------- SHOP CONFIG ----------
const shopConfig = computed<{
  title: string
  items: any[]
  type: ShopType
  action: Function
  filter?: Function
} | null>(() => {
  switch (openedShop.value) {
    case "patterns":
      return {
        title: "Pattern Shop",
        items: patternList.value,
        type: "patterns",
        action: buyPattern,
        filter: (p: Pattern) => canProducePattern(p) && !ownedPatterns.value.includes(p.id),
      }

    case "machines":
      return {
        title: "Machines",
        items: machines.value,
        type: "machines",
        action: buyMachine,
      }

    case "upgrades":
      return {
        title: "Upgrades",
        items: Object.values(upgrades.value),
        type: "upgrades",
        action: buyUpgrade,
      }

    case "inventory":
      return {
        title: "Inventory",
        items: ownedPatterns.value
          .map((id) => patterns[id])
          .filter(Boolean),
        type: "inventory",
        action: setPattern,
      }

    case "prestige":
      return {
        title: "Prestige",
        items: [{ reward: calculatePrestigeReward() }],
        type: "prestige",
        action: prestige,
      }

    default:
      return null
  }
})

// ---------- HELPERS ----------
function getItemKey(item: any) {
  if (!item) return Math.random()
  if ("id" in item) return item.id
  if ("key" in item) return item.key
  if ("reward" in item) return "prestige"
  return Math.random()
}

// ---------- LOGIC ----------
function buyMachine(machine: any) {
  if (money.value >= machine.price && !machine.owned) {
    money.value -= machine.price
    machine.owned = true
  }
}

function buyUpgrade(upgradeKey: keyof Upgrades) {
  const upgrade = upgrades.value[upgradeKey]
  if (!upgrade || money.value < upgrade.value) return

  money.value -= upgrade.value
  upgrade.lvl++

  // cost scaling
  const costScale = upgrade.valueScale ?? 1.6
  upgrade.value = Math.floor((upgrade.baseCost ?? 50) * Math.pow(costScale, upgrade.lvl))

  // power scaling
  const powerScale = upgrade.powerScale ?? 1.15
  upgrade.power = Number(((upgrade.baseValue ?? 1) * Math.pow(powerScale, upgrade.lvl)).toFixed(2))
}

const ownedMachineCapabilities = computed(() => ({
  color: machines.value.some((m) => m.id === "color" && m.owned),
  cut: machines.value.some((m) => m.id === "cut" && m.owned),
  merged: machines.value.some((m) => m.id === "merge" && m.owned),
}))

function canProducePattern(pattern: Pattern) {
  return Object.entries(pattern.requirements).every(
    ([req, needed]) =>
      !needed || (ownedMachineCapabilities.value as any)[req]
  )
}

function mobileOpen(tab: string) {
  openedShop.value = tab
}

// ---------- INIT ----------
onMounted(() => {
  loadGame(patterns)
  applyOfflineProgress()
  startFactoryLoop()
  saveGame()
})


//Todo: 
//dailt only avaible
//prestige format
//Prestige cur pattern reset
//Fx sfx ui - lobbby hudba + mute/volume butun
//watch from cajty website
//idle Cap - upgrade to idle cap
//stat idle cap

</script>

<style lang="scss">
@use "@/styles/main.scss" as *;
</style>