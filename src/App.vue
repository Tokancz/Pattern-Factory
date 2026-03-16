<template>
    <HeaderBar
      :factoryName="factoryName"
      :userName="userName"
      :lvl="lvl"
      :exp="exp"
      :expToNextLvl="expToNextLvl"
      :gainedMoney="gainedMoney"
      :lvlPopUp="lvlPopUp"
      :mobileMenu="mobileMenu"
      :openedShop="openedShop"
      :formatNumber="formatNumber"
      @openMenu="mobileMenu = true"
    />
    <main>
        <aside id="stats">
            <section>
                <h3>Stats</h3>
                <p>Idle: {{ formatNumber(Math.floor(idleIncomePerSecond * 100) / 100) }} IGM/s</p>
                <p>Parts Sold: {{ formattedPartsSold }}</p>
            </section>
            <section>
                <h3>Progress</h3>
                <p>Next Part: {{ Math.floor(creatingProgress / currentPattern.creationTime * 100) }} %</p>
                <input type="range" min="0" :max="currentPattern.creationTime" class="slider" v-model="creatingProgress" disabled="true">
                <p>Initial Price: {{ formatNumber(currentPattern.baseValue) }} IGM</p>
                <p>Current Price: {{ displayValue(currentPattern) }} IGM</p>
            </section>
            <section>
                <h3>Daily Pattern</h3>
                <p>1.5x mutliplier !!</p>
                <p>Price: {{ displayValue(dailyPattern) }} IGM</p>
                <p>DC: 10 DC</p>
                <svg v-if="dailyPattern?.traits"
                  viewBox="0 0 32 32"
                  draggable="false"
                  :style="{ fill: dailyPattern.traits.color }"
                  v-html="shapes[dailyPattern.traits.shape]">
                </svg>
            </section>
        </aside>
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
                </div>
                <button class="button" @click="openedShop = 'inventory'">Inventory</button>
            </aside>
        </section>
        <section class="tab" v-if="openedShop === 'patterns'">
            <div class="shop_header">
                <h4>Pattern Shop</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <div class="container">
              <PatternCard
                v-for="pattern in patternList"
                :key="pattern.id"
                :pattern="pattern"
                :shapes="shapes"
                :formatNumber="formatNumber"
                :displayValue="displayValue"
                @buy="buyPattern"
              />
            </div>
            <p v-if="ownedPatterns.length % Object.keys(colors).length === 0">Nothing else to buy. Try buying a new machine or upgrade</p><!--Fix-->
        </section>
        <section class="tab" v-if="openedShop === 'machines'">
            <div class="shop_header">
                <h4>Machines Shop</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <div class="container">
              <MachineCard
                v-for="machine in machines"
                :key="machine.id"
                :machine="machine"
                :formatNumber="formatNumber"
                @buy="buyMachine"
              />
            </div>
        </section>
        <section class="tab" v-if="openedShop === 'upgrades'">
            <div class="shop_header">
                <h4>Upgrade</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <div class="container">
              <UpgradeCard
                v-for="upgrade in upgrades"
                :key="upgrade.id"
                :upgrade="upgrade"
                :formatNumber="formatNumber"
                @buy="buyUpgrade"
              />
            </div>
        </section>
        <section class="tab" v-if="openedShop === 'prestige'">
            <div class="shop_header">
                <h4>Prestige</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <p>Prestige will remove your current money, patterns and machines but will grant you permanent bonuses!!</p>
            <button v-if="calculatePrestigeReward() > 1" @click="prestige">Prestige (Gain {{ calculatePrestigeReward() }} PP)</button>
        </section>
        <section class="tab" v-if="openedShop === 'inventory'">
            <div class="shop_header">
                <h4>Inventory</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <div class="container">
                <div class="pattern" v-for="pattern in patternList" :key="pattern.id" :disabled="!canProducePattern(pattern)" v-show="pattern.owned" @click="setPattern(pattern)">
                    <svg viewBox="0 0 32 32" 
                      :style="{fill: pattern.traits.color}"
                      v-html="shapes[pattern.traits.shape]">
                    </svg>
                    <p>Price: {{ displayValue(pattern) }}</p>
                    <p>Exp: {{ formatNumber(pattern.baseExp) }}</p>
                    <p>Creation time: {{ formatNumber(pattern.creationTime) }}</p>
                    <button v-if="currentPattern.id !== pattern.id"  @click="setPattern(pattern)">Select</button>
                    <button v-if="currentPattern.id == pattern.id">Selected</button>
                </div>
            </div>
        </section>
        <section id="mobileMenu" v-if="mobileMenu">
            <img src="/img/Shop.png" alt="shopBG" draggable="false">
            <aside>
                <div class="shop_header">
                    <h2>MENU</h2>
                    <i  @click="mobileMenu = false" class="fa-solid fa-chevron-up" aria-hidden="true"></i>
                </div>
                <div class="shop_buttons">
                    <button class="button" @click="mobileOpen(`patterns`)">Patterns</button>
                    <button class="button" @click="mobileOpen(`machines`)">Machines</button>
                    <button class="button" @click="mobileOpen(`upgrades`)">Upgrades</button>
                    <button class="button" @click="mobileOpen(`prestige`)">Prestige</button>
                    <button class="button" @click="mobileOpen(`inventory`)">Inventory</button>
                    <button class="button">Stats</button>
                </div>
                <section>
                  <h3>Daily Pattern</h3>
                  <p>1.5x mutliplier !!</p>
                  <p>Price: {{ displayValue(dailyPattern) }} IGM</p>
                  <p>DC: 10 DC</p>
                  <svg v-if="dailyPattern?.traits"
                    viewBox="0 0 32 32"
                    draggable="false"
                    :style="{ fill: dailyPattern.traits.color }"
                    v-html="shapes[dailyPattern.traits.shape]">
                  </svg>
                </section>
            </aside>
        </section>
        <div v-if="showOfflinePopup" id="offlineReward">
            <p @click="closeOfflinePopup" class="close">X</p>
            <h3>Welocme back!</h3>
            <p>While you were away you earned {{ formatNumber(offlineReward) }} IGM</p>
        </div>
    </main>
    <footer>
        <img src="/img/Footer.png" alt="Footer" draggable="false">
        <p id="money">Money: {{ formattedMoney }} IGM</p>
        <p id="dc">DC: {{ formatNumber(dc) }}</p>
    </footer>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue"
import { useGameState } from "@/composables/useGameState"
import { usePatterns } from "@/composables/usePatterns"
import { useFactory } from "@/composables/useFactory"
import { usePrestige } from "@/composables/usePrestige"
import { useOffline } from "@/composables/useOffline"

export default defineComponent({
  name: "App",
  setup() {
    // ---------- COLORS ----------
    const colors = {
      gray: "#cdcdcd",
      red: "#ff4d4d",
      blue: "#85a7ff",
      green: "#4ddf88",
      yellow: "#ffd972",
      purple: "#9858ed",
      cyan: "#4dd2df"
    }

    // ---------- UPGRADES ----------
    const upgrades = {
      clickingPower: { id: "Clicking Power", lvl: 1, value: 50, power: 25 },
      creationSpeed: { id: "Creation Speed", lvl: 1, value: 100, power: 1 },
      sellMultiplier: { id: "Sell Mutliplier", lvl: 1, value: 100, power: 1 }
    }

    // ---------- Core Game State ----------
    const { money, dc, lvl, exp, expToNextLvl, formattedMoney, formattedPartsSold, gainExp, partsSold, formatNumber } = useGameState()

    // ---------- Patterns ----------
    const {
      patterns,
      patternList,
      ownedPatterns,
      currentPattern,
      setPattern,
      buyPattern,
      dailyPattern,
      displayValue: patternDisplayValue
    } = usePatterns(upgrades, ref(1), formatNumber, colors)

    // ---------- Factory ----------
    const { machines, parts, creatingProgress, spawnPart, click, startFactoryLoop, machinePos, partStyle } = useFactory(currentPattern, upgrades, prestigeMultiplier, dailyPattern, money, dc, partsSold, gainExp, colors)

    // ---------- Prestige ----------
    const { prestigePoints, prestigeMultiplier, prestige } = usePrestige(money, ownedPatterns, patterns, upgrades, ref([]), machines, parts, creatingProgress, currentPattern)

    // ---------- Offline ----------
    const { showOfflinePopup, offlineReward, applyOfflineProgress } = useOffline(money, currentPattern, upgrades, prestigeMultiplier)

    // ---------- Actions ----------
    function clickFactory() {
      click()
    }

    function buyMachine(machine: any) {
      if (money.value >= machine.price && !machine.owned) {
        money.value -= machine.price
        machine.owned = true
        localStorage.setItem("money", money.value.toString())
      }
    }

    function buyPatternWrapper(pattern: any) {
      buyPattern(pattern, money)
    }

    // ---------- Lifecycle ----------
    onMounted(() => {
      startFactoryLoop()
      applyOfflineProgress()
      localStorage.setItem("lastOnline", Date.now().toString())
    })

    return {
      money,
      formattedMoney,
      partsSold,
      formattedPartsSold,
      currentPattern,
      patternList,
      ownedPatterns,
      setPattern,
      buyPattern: buyPatternWrapper,
      dailyPattern,
      patternDisplayValue,
      clickFactory,
      machines,
      buyMachine,
      parts,
      creatingProgress,
      machinePos,
      partStyle,
      showOfflinePopup,
      offlineReward,
      prestigePoints,
      prestigeMultiplier,
      prestige,
      formatNumber
    }
  }
})
</script>

<style lang="scss">
  @use "@/styles/main.scss" as *;
</style>