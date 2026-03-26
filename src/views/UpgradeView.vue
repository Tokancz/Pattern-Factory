<template>
  <Panel :title="pageTitle">
    <div class="wrapper">
      <button class="button arrow" @click="prevPage" :class="{ disabled: page === 0 }">
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <div class="grid">
        <!-- Normal upgrades (pages 0-1) -->
        <template v-if="pageType === 'normal'">
          <div v-for="upgrade in paginatedItems" :key="upgrade.id" class="upgrade">
            <img :src="upgrade.src" class="upgrade-image" draggable="false" />
            <div class="text-container">
              <p class="upgrade-name">{{ upgrade.name }}</p>
              <p>{{ upgrade.description }}</p>
              <p v-if="(levels[upgrade.id] ?? 0) > 0">
                Lvl: {{ levels[upgrade.id] }}
                <span v-if="upgrade.maxLevel"> / {{ upgrade.maxLevel }}</span>
              </p>
              <p v-if="isNormalMaxed(upgrade)" class="tag-maxed">MAX</p>
              <p v-else class="upgrade-cost">Cost: {{ formatNumber(getCost(upgrade.id)) }} IGM</p>
            </div>
            <button
              @click="buy(upgrade.id)"
              class="button"
              :disabled="isNormalMaxed(upgrade)"
            >Buy</button>
          </div>
        </template>

        <!-- DC upgrades (pages 2-3) -->
        <template v-else-if="pageType === 'dc'">
          <div v-for="upgrade in paginatedItems" :key="upgrade.id" class="upgrade">
            <img :src="upgrade.src" class="upgrade-image" draggable="false" />
            <div class="text-container">
              <p class="upgrade-name">{{ upgrade.name }}</p>
              <p>{{ upgrade.description }}</p>
              <p v-if="(dcLevels[upgrade.id] ?? 0) > 0">Lvl: {{ dcLevels[upgrade.id] }}</p>
              <p class="upgrade-cost dc-cost">Cost: {{ formatNumber(getDcCost(upgrade.id)) }} DC</p>
            </div>
            <button @click="buyDc(upgrade.id)" class="button dc-btn">Buy</button>
          </div>
        </template>

        <!-- Prestige upgrades (last page) -->
        <template v-else-if="pageType === 'prestige'">
          <div v-for="upgrade in paginatedItems" :key="upgrade.id" class="upgrade prestige">
            <img :src="upgrade.src" class="upgrade-image" draggable="false" />
            <div class="text-container">
              <p class="upgrade-name">{{ upgrade.name }}</p>
              <p>{{ upgrade.description }}</p>
              <p v-if="(prestigeLevels[upgrade.id] ?? 0) > 0">Lvl: {{ prestigeLevels[upgrade.id] }}</p>
              <p class="upgrade-cost prestige-cost">Cost: {{ formatNumber(getPrestigeCost(upgrade.id)) }} PP</p>
            </div>
            <button @click="buyPrestige(upgrade.id)" class="button prestige-btn">Buy</button>
          </div>
        </template>
      </div>

      <button class="button arrow" @click="nextPage" :class="{ disabled: page === totalPages - 1 }">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { UPGRADES, DC_UPGRADES, PRESTIGE_UPGRADES } from "@/data/upgrades"
import { useUpgradeStore } from "@/stores/upgrade"
import { formatNumber } from "@/utils/format"
import { ref, computed } from "vue"

const upgradeStore = useUpgradeStore()
const { levels, dcLevels, prestigeLevels, getCost, getDcCost, getPrestigeCost, buy, buyDc, buyPrestige } = upgradeStore

const page = ref(0)
const perPage = 4

const normalList = Object.entries(UPGRADES).map(([id, data]) => ({ id, ...data }))
const dcList = Object.entries(DC_UPGRADES).map(([id, data]) => ({ id, ...data }))
const prestigeList = Object.entries(PRESTIGE_UPGRADES).map(([id, data]) => ({ id, ...data }))

const normalPages = Math.ceil(normalList.length / perPage)   // 2 pages (6 items)
const dcPages = Math.ceil(dcList.length / perPage)           // 2 pages (8 items)
const prestigePages = Math.ceil(prestigeList.length / perPage) // 1 page (3 items)

const totalPages = computed(() => normalPages + dcPages + prestigePages)

const pageType = computed(() => {
  if (page.value < normalPages) return 'normal'
  if (page.value < normalPages + dcPages) return 'dc'
  return 'prestige'
})

const pageTitle = computed(() => {
  if (pageType.value === 'normal') return 'Upgrades'
  if (pageType.value === 'dc') return 'DC Upgrades'
  return '⬡ Prestige Upgrades'
})

const paginatedItems = computed(() => {
  if (pageType.value === 'normal') {
    const start = page.value * perPage
    return normalList.slice(start, start + perPage)
  }
  if (pageType.value === 'dc') {
    const dcPage = page.value - normalPages
    const start = dcPage * perPage
    return dcList.slice(start, start + perPage)
  }
  // prestige
  const prestigePage = page.value - normalPages - dcPages
  const start = prestigePage * perPage
  return prestigeList.slice(start, start + perPage)
})

function isNormalMaxed(upgrade: { id: string; maxLevel?: number }) {
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
</style>