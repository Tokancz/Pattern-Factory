<template>
  <Panel :title="isPrestigePage ? '⬡ Prestige Upgrades' : 'Upgrades'">
    <div class="wrapper">
      <button class="button arrow" @click="prevPage" :class="{ disabled: page === 0 }">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      <div class="grid">
        <div v-for="upgrade in paginatedUpgrades" :key="upgrade.id"
          class="upgrade" :class="{ prestige: upgrade.type === 'prestige' }">

          <img :src="upgrade.src" class="upgrade-image" draggable="false"/>
          <div class="text-container">
            <p class="upgrade-name">{{ upgrade.name }}</p>
            <p>{{ upgrade.description }}</p>

            <p v-if="getLevel(upgrade) > 0">
              Lvl: {{ getLevel(upgrade) }}
              <span v-if="upgrade.maxLevel"> / {{ upgrade.maxLevel }}</span>
            </p>
            <p v-if="isMaxed(upgrade)" class="maxed">MAX</p>

            <p class="upgrade-cost">
              Cost: {{ formatNumber(getUpgradeData(upgrade).cost) }}
              {{ getUpgradeData(upgrade).currency }}
            </p>
          </div>
          <button
            @click="upgrade.type === 'prestige' ? buyPrestige(upgrade.id) : buy(upgrade.id)"
            class="button"
            :disabled="upgrade.type === 'normal' && isMaxed(upgrade)"
          >Buy
          </button>
        </div>
      </div>
      <button class="button arrow" @click="nextPage" :class="{ disabled: page === totalPages - 1 }">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
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

const normalUpgrades = computed(() =>
  Object.entries(UPGRADES).map(([id, data]) => ({
    id,
    ...data,
    type: "normal"
  }))
)

const prestigeUpgrades = computed(() =>
  Object.entries(PRESTIGE_UPGRADES).map(([id, data]) => ({
    id,
    ...data,
    type: "prestige"
  }))
)

const isPrestigePage = computed(() => {
  return page.value >= normalPages.value
})

const normalPages = computed(() =>
  Math.ceil(normalUpgrades.value.length / perPage)
)

const prestigePages = computed(() =>
  Math.ceil(prestigeUpgrades.value.length / perPage)
)

const totalPages = computed(() =>
  normalPages.value + prestigePages.value
)

const paginatedUpgrades = computed(() => {
  // NORMAL PAGES
  if (page.value < normalPages.value) {
    const start = page.value * perPage
    return normalUpgrades.value.slice(start, start + perPage)
  }

  // PRESTIGE PAGES
  const prestigePageIndex = page.value - normalPages.value
  const start = prestigePageIndex * perPage

  return prestigeUpgrades.value.slice(start, start + perPage)
})

function getLevel(upgrade: any) {
  return upgrade.type === "prestige"
    ? (prestigeLevels[upgrade.id] ?? 0)
    : (levels[upgrade.id] ?? 0)
}

function isMaxed(upgrade: { id: string; maxLevel?: number; type: string }) {
  if (!upgrade.maxLevel) return false

  const lvl = upgrade.type === "prestige"
    ? (prestigeLevels[upgrade.id] ?? 0)
    : (levels[upgrade.id] ?? 0)

  return lvl >= upgrade.maxLevel
}

function getUpgradeData(upgrade: any) {
  const isPrestige = upgrade.type === "prestige"

  return {
    level: isPrestige
      ? (prestigeLevels[upgrade.id] ?? 0)
      : (levels[upgrade.id] ?? 0),

    cost: isPrestige
      ? getPrestigeCost(upgrade.id)
      : getCost(upgrade.id),

    currency: isPrestige ? "PP" : "IGM"
  }
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