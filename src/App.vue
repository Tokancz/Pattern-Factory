<template>
  <HeaderBar
    :gainedMoney="gainedMoney"
    :lvlPopUp="lvlPopUp"
    :mobileMenu="mobileMenu"
    :openedShop="openedShop"
    :formatNumber="formatNumber"
    @openMenu="mobileMenu = true"
  />

  <Login v-if="!isNameSet" />

  <main>
    <StatsAside
      v-if="!mobileMenu"
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

    <!-- Shop Sections -->
    <section id="shopList">
      <img src="/img/Shop.png" alt="shopBG" draggable="false">
      <aside>
        <div class="shop_header">
          <h2>SHOP</h2>
          <img src="/img/ShoppingCart.png" alt="Shop Icon" draggable="false">
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

    <section class="tab" v-if="shopConfig">
      <div class="shop_header">
        <h4>{{ shopConfig.title }}</h4>
        <p @click="openedShop = ''">X</p>
      </div>

      <div class="container">
        <ShopCard
          v-for="item in shopConfig.items"
          :key="item.id || item.reward"
          :type="shopConfig.type"
          :data="item"
          :shapes="shapes"
          :formatNumber="formatNumber"
          :displayValue="displayValue"
          @buy="shopConfig.action"
          @select="shopConfig.action"
          @prestige="shopConfig.action"
          v-show="shopConfig.filter ? shopConfig.filter(item) : true"
        />
      </div>
    </section>

    <section id="mobileMenu" v-if="mobileMenu">
      <img src="/img/Shop.png" alt="shopBG" draggable="false">
      <aside>
        <div class="shop_header">
          <h2>MENU</h2>
          <i @click="mobileMenu = false" class="fa-solid fa-chevron-up"></i>
        </div>
        <div class="shop_buttons">
          <button class="button" @click="mobileOpen('patterns')">Patterns</button>
          <button class="button" @click="mobileOpen('machines')">Machines</button>
          <button class="button" @click="mobileOpen('upgrades')">Upgrades</button>
          <button class="button" @click="mobileOpen('prestige')">Prestige</button>
          <button class="button" @click="mobileOpen('inventory')">Inventory</button>
          <button class="button">Stats</button>
        </div>
      </aside>
    </section>

    <div v-if="showOfflinePopup" id="offlineReward">
      <p @click="closeOfflinePopup" class="close">X</p>
      <h3>Welcome back!</h3>
      <p>While you were away you earned {{ formatNumber(offlineReward) }} IGM</p>
    </div>
  </main>
  <CurrencyBar :money="formatNumber(money)" :dc="formatNumber(dc)" />
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useGameState } from '@/composables/useGameState'
import { usePatterns } from '@/composables/usePatterns'
import { useFactory } from '@/composables/useFactory'
import { usePrestige } from '@/composables/usePrestige'
import { useOffline } from '@/composables/useOffline'
import { useSaveSystem } from '@/composables/useSaveSystem'
import { gameStore, isNameSet} from '@/stores/useGameStore'
import HeaderBar from '@/components/HeaderBar.vue'
import FactorySimulation from '@/components/FactorySimulation.vue'
import ShopCard from '@/components/ShopCard.vue'
import CurrencyBar from './components/CurrencyBar.vue'
import Login from '@/components/Login.vue'
import StatsAside from './components/StatsAside.vue'
import type { Pattern } from '@/types/Pattern'
import type { Upgrades } from '@/types/Upgrade'

// ---------- COLORS ----------
const colors = {
  gray: '#cdcdcd',
  red: '#ff4d4d',
  blue: '#85a7ff',
  green: '#4ddf88',
  yellow: '#ffd972',
  purple: '#9858ed',
  cyan: '#4dd2df'
} as const

// ---------- GAME STATE ----------
const { money, dc, prestigeMultiplier, upgrades } = gameStore

const { gainExp, formatNumber } = useGameState()
// ---------- PATTERNS ----------
const { patterns, patternList, ownedPatterns, currentPattern, setPattern, buyPattern, dailyPattern, displayValue, shapes } = usePatterns(colors)
// ---------- FACTORY ----------
const { machines, parts, creatingProgress, click, startFactoryLoop, machinePos, partStyle } = useFactory( gainExp, colors )
// ---------- PRESTIGE ----------
const { prestigePoints, prestige, calculatePrestigeReward } = usePrestige(patterns, ref([]), parts, creatingProgress)
// ---------- OFFLINE ----------
const { showOfflinePopup, offlineReward, applyOfflineProgress } = useOffline()

const { saveGame, loadGame } = useSaveSystem()

// ---------- EXTRA STATE ----------
const gainedMoney = ref(0)
const lvlPopUp = ref(false)
const openedShop = ref('')
const mobileMenu = ref(false)

const shopConfig = computed(() => {
  switch (openedShop.value) {
    case 'patterns':
      return {
        title: 'Pattern Shop',
        items: patternList.value,
        type: 'patterns',
        action: buyPattern,
        filter: (p: Pattern) => canProducePattern(p) && !p.owned
      }

    case 'upgrades':
      return {
        title: 'Upgrades',
        items: Object.values(upgrades.value),
        type: 'upgrades',
        action: buyUpgrade
      }

    case 'inventory':
      return {
        title: 'Inventory',
        items: ownedPatterns.value,
        type: 'inventory',
        action: setPattern
      }

    case 'prestige':
      return {
        title: 'Prestige',
        items: [{ reward: calculatePrestigeReward() }],
        type: 'prestige',
        action: prestige
      }

    default:
      return null
  }
})

function closeOfflinePopup() { showOfflinePopup.value = false }

function buyMachine(machine: any) {
  if (money.value >= machine.price && !machine.owned) {
    money.value -= machine.price
    machine.owned = true
  }
}

function buyUpgrade(upgradeKey: keyof Upgrades) {
  const upgrade = upgrades.value[upgradeKey]

  if (!upgrade) return

  if (money.value < upgrade.value) return

  money.value -= upgrade.value
  upgrade.lvl++

  upgrade.value = Math.floor(50 * Math.pow(1.6, upgrade.lvl))
  upgrade.power = Math.floor(10 * Math.pow(1.15, upgrade.lvl)) / 10 
}

Object.values(patterns).forEach(pattern => {
  pattern.owned =
    pattern.owned || ownedPatterns.value.includes(pattern.id)
})

const ownedMachineCapabilities = computed(() => {
  return {
    color: machines.value.some(m => m.id === "color" && m.owned),
    cut: machines.value.some(m => m.id === "cut" && m.owned),
    merged: machines.value.some(m => m.id === "merge" && m.owned)
  }
})

function canProducePattern(pattern: Pattern) {
  return Object.entries(pattern.requirements).every(
    ([req, needed]) => !needed || (ownedMachineCapabilities.value as any)[req]
  )
}

function mobileOpen(tab: string) { openedShop.value = tab }

onMounted(() => {
  loadGame(patterns)
  applyOfflineProgress()
  startFactoryLoop()
  saveGame()
})

//Todo: 
//computed na multipliery
//watch na eventy
//dailt only avaible
//prestige format
//Prestige cur pattern reset
//Fx sfx ui - lobbby hudba + mute/volume butun
//watch from cajty website
//idle Cap - upgrade to idle cap
//stat idle cap
//vicestrankova app
//?Admin page???

</script>

<style lang="scss">
@use "@/styles/main.scss" as *;
</style>