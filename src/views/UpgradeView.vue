<template>
  <Panel title="Upgrades">
    <div class="upgrade-wrapper">
      <button class="button arrow" @click="prevPage"><i class="fa-solid fa-chevron-left"></i></button>

      <div class="grid">
        <div v-for="upgrade in paginatedUpgrades" :key="upgrade.id" class="upgrade">
          <img :src="upgrade.src" class="upgrade-image" />

          <div class="text-container">
            <p class="upgrade-name">{{ upgrade.name }}</p>
            <p>{{ upgrade.description }}</p>
            <p v-if="levels[upgrade.id] != 0">
              Lvl: {{ levels[upgrade.id] }}
            </p>
            <p class="upgrade-cost">Cost: {{ getCost(upgrade.id) }} {{ getCurrencyLabel(upgrade.currency) }}</p>
          </div>

          <button @click="buy(upgrade.id)" class="button">Buy</button>
        </div>
      </div>

      <button class="button arrow" @click="nextPage"><i class="fa-solid fa-chevron-right"></i></button>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { UPGRADES } from "@/data/upgrades"
import { useUpgradeStore } from "@/stores/upgrade"
import { ref, computed } from "vue"

const upgrades = useUpgradeStore()

const levels = upgrades.levels
const getCost = upgrades.getCost
const buy = upgrades.buy

const page = ref(0)
const perPage = 4

// Pagination logic ------------
const upgradeList = computed(() =>
  Object.entries(UPGRADES).map(([id, data]) => ({
    id,
    ...data
  }))
)
const paginatedUpgrades = computed(() => {
  const start = page.value * perPage
  return upgradeList.value.slice(start, start + perPage)
})

function getCurrencyLabel(currency: string) {
  if (currency === "money") return "IGM"
  if (currency === "prestige") return "PP"
  return ""
}

const totalPages = computed(() =>
  Math.ceil(upgradeList.value.length / perPage)
)

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