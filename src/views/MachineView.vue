<template>
  <Panel title="Machines">
    <div class="wrapper">
      <button class="button arrow" @click="prevPage" :class="{ disabled: page === 0 }">
        <i class="fa-solid fa-chevron-left"></i>
      </button>

      <div class="grid">
        <div v-for="machine in paginatedMachines" :key="machine.id" class="machine">
          <img :src="machine.src" class="machine-image" />

          <div class="text-container">
            <p class="machine-name">{{ machine.name }}</p>
            <p>{{ machine.description }}</p>
            <template v-if="isMachineMaxed(machine.id)">
              <p class="tag-maxed">MAX</p>
            </template>
            <template v-else>
              <p class="machine-cost">
                Cost: {{ formatNumber(getCost(machine.id)) }}
                {{ getCurrencyLabel((machine as any).currency) }}
              </p>
              <p v-if="machines.getLevel(machine.id) > 0" class="machine-level">
                Lvl: {{ machines.getLevel(machine.id) }}
              </p>
            </template>
          </div>

          <button
            @click="buy(machine.id)"
            class="button"
            :disabled="isMachineMaxed(machine.id)"
          >Buy</button>
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

function getCurrencyLabel(currency: string) {
  if (currency === "money") return "IGM"
  if (currency === "prestige") return "PP"
  return ""
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

.tag-maxed {
  color: var(--primary);
  font-weight: bold;
  font-size: 1.1em;
}

.machine-level {
  font-size: 0.85em;
  opacity: 0.7;
}
</style>