<template>
  <Panel title="Machines">
    <div class="wrapper">
      <button class="button arrow" type="button" aria-label="Previous page" @click="prevPage" :class="{ disabled: page === 0 }">
        <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
      </button>

      <ul class="grid">
        <li v-for="machine in paginatedMachines" :key="machine.id" class="machine">
          <img :src="machine.src" class="machine-image" :alt="machine.name" />

          <div class="text-container">
            <h3 class="machine-name">{{ machine.name }}</h3>
            <p>{{ machine.description }}</p>
            <template v-if="isMachineMaxed(machine.id)">
              <p class="tag-maxed">MAX</p>
            </template>
            <template v-else>
              <p class="machine-cost">
                Cost: {{ formatNumber(getCost(machine.id)) }} IGM
              </p>
              <p v-if="machines.getLevel(machine.id) > 0" class="machine-level">
                Lvl: {{ machines.getLevel(machine.id) }}
              </p>
            </template>
          </div>

          <button
            type="button"
            @click="buy(machine.id)"
            class="button"
            :disabled="isMachineMaxed(machine.id)"
          >Buy</button>
        </li>
      </ul>

      <button class="button arrow" type="button" aria-label="Next page" @click="nextPage" :class="{ disabled: page === totalPages - 1 }">
        <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
      </button>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { MACHINES } from "@/data/machines"
import { useMachineStore } from "@/stores/machine"
import { useSlotStore } from "@/stores/slot"
import { formatNumber } from "@/utils/format"
import { ref, computed } from "vue"

const machines = useMachineStore()
const slots = useSlotStore()

const getCost = machines.getCost
const buy = machines.buy

const page = ref(0)
const perPage = 4

const MAX_SLOTS = 4

function isMachineMaxed(id: string): boolean {
  if (id === "slotUnlock") {
    return slots.slots.filter(s => s.unlocked).length >= MAX_SLOTS
  }
  return false
}

// Pagination logic
const machineList = computed(() =>
  Object.entries(MACHINES).map(([id, data]) => ({
    id,
    ...data
  }))
)
const paginatedMachines = computed(() => {
  const start = page.value * perPage
  return machineList.value.slice(start, start + perPage)
})

const totalPages = computed(() =>
  Math.ceil(machineList.value.length / perPage)
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