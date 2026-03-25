<template>
  <Panel title="Upgrades">
    <div class="wrapper">
      <!-- Regular upgrades -->
      <div class="upgrade-section">
        <div class="section-label">IGM Upgrades</div>
        <div class="nav-row">
          <button class="button arrow" @click="prevPage"><i class="fa-solid fa-chevron-left"></i></button>
          <div class="grid">
            <div v-for="upgrade in paginatedUpgrades" :key="upgrade.id" class="upgrade">
              <img :src="upgrade.src" class="upgrade-image" />
              <div class="text-container">
                <p class="upgrade-name">{{ upgrade.name }}</p>
                <p>{{ upgrade.description }}</p>
                <p v-if="(levels[upgrade.id] ?? 0) > 0">
                  Lvl: {{ levels[upgrade.id] }}
                  <span v-if="upgrade.maxLevel"> / {{ upgrade.maxLevel }}</span>
                </p>
                <p v-if="isMaxed(upgrade)" class="maxed">MAX</p>
                <p v-else class="upgrade-cost">Cost: {{ formatNumber(getCost(upgrade.id)) }} IGM</p>
              </div>
              <button
                @click="buy(upgrade.id)"
                class="button"
                :disabled="isMaxed(upgrade)"
              >Buy</button>
            </div>
          </div>
          <button class="button arrow" @click="nextPage"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>

      <!-- Prestige upgrades -->
      <div class="upgrade-section prestige-section">
        <div class="section-label prestige-label">⬡ Prestige Upgrades</div>
        <div class="grid">
          <div v-for="upgrade in prestigeUpgradeList" :key="upgrade.id" class="upgrade prestige-upgrade">
            <img :src="upgrade.src" class="upgrade-image" />
            <div class="text-container">
              <p class="upgrade-name">{{ upgrade.name }}</p>
              <p>{{ upgrade.description }}</p>
              <p v-if="(prestigeLevels[upgrade.id] ?? 0) > 0">Lvl: {{ prestigeLevels[upgrade.id] }}</p>
              <p class="upgrade-cost prestige-cost">Cost: {{ formatNumber(getPrestigeCost(upgrade.id)) }} PP</p>
            </div>
            <button @click="buyPrestige(upgrade.id)" class="button prestige-btn">Buy</button>
          </div>
        </div>
      </div>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { UPGRADES, PRESTIGE_UPGRADES } from "@/data/upgrades"
import { useUpgradeStore } from "@/stores/upgrade"
import { formatNumber } from "@/utils/format"
import { ref, computed } from "vue"

const upgradeStore = useUpgradeStore()

const levels = upgradeStore.levels
const prestigeLevels = upgradeStore.prestigeLevels
const getCost = upgradeStore.getCost
const getPrestigeCost = upgradeStore.getPrestigeCost
const buy = upgradeStore.buy
const buyPrestige = upgradeStore.buyPrestige

const page = ref(0)
const perPage = 4

const upgradeList = computed(() =>
  Object.entries(UPGRADES).map(([id, data]) => ({ id, ...data }))
)

const prestigeUpgradeList = computed(() =>
  Object.entries(PRESTIGE_UPGRADES).map(([id, data]) => ({ id, ...data }))
)

const paginatedUpgrades = computed(() => {
  const start = page.value * perPage
  return upgradeList.value.slice(start, start + perPage)
})

const totalPages = computed(() =>
  Math.ceil(upgradeList.value.length / perPage)
)

function isMaxed(upgrade: { id: string; maxLevel?: number }) {
  if (!upgrade.maxLevel) return false
  return (levels[upgrade.id] ?? 0) >= upgrade.maxLevel
}

function nextPage() {
  if (page.value < totalPages.value - 1) page.value++
}
function prevPage() {
  if (page.value > 0) page.value--
}
</script>

<style scoped lang="scss">
@use "@/styles/views.scss";

.wrapper {
  flex-direction: column;
  gap: 30px;
}

.upgrade-section {
  width: 100%;
  @include flexColumn(10px, start, start);
}

.section-label {
  color: var(--white);
  font-size: 1.1em;
  font-weight: bold;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 2px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
}

.prestige-label {
  color: var(--primary);
  opacity: 1;
}

.nav-row {
  width: 100%;
  @include flexRow(20px);
}

.prestige-section {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.prestige-upgrade {
  border: 1px solid var(--primary);
  background-color: rgba(192, 254, 4, 0.05) !important;
}

.prestige-cost {
  color: var(--primary) !important;
}

.prestige-btn {
  border-color: var(--primary);
  &:hover {
    background-color: var(--primary);
    color: var(--black);
  }
}

.maxed {
  color: var(--primary);
  font-weight: bold;
  font-size: 0.9em;
}

.upgrade-cost {
  color: var(--secondary);
}
</style>