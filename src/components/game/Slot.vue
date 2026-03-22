<template>
  <div class="slot" @click="handleClick">
    <div v-if="slot.patternId">
      <div>{{ slot.patternId.toUpperCase() }}</div>
      <div>{{ bar }}</div>
    </div>

    <div v-else class="empty">
      +
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { generateBar } from "@/utils/ascii"
import { useSlotStore } from "@/stores/useSlotStore"
import { usePatternStore } from "@/stores/usePatternStore"

const patternStore = usePatternStore()

const props = defineProps<{
  slot: any
}>()

const slots = useSlotStore()

const bar = computed(() =>
  generateBar(props.slot.progress, slots.maxProgress, 14)
)

function handleClick() {
  if (!props.slot.patternId) {
    const available = patternStore.unlockedPatterns
    const selected = prompt(`Choose: ${available.join(", ")}`)

    if (selected && available.includes(selected)) {
      slots.assignPattern(props.slot.id, selected)
    }
    return
  }

  slots.clickSlot(props.slot.id)
}
</script>

<style scoped lang="scss">
.slot {
  border: 1px solid #C0FE04;
  padding: 10px;
  width: 150px;
  cursor: pointer;
  user-select: none;
}

.empty {
  color: #666;
}
</style>