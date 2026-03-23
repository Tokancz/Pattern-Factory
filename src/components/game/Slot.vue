<template>
  <div class="slot" @click="handleClick">
    <img src="/img/Slot.png" alt="slot background" aria-hidden="true">
    <div v-if="slot.patternId" class="slotPattern">
      <img src="" alt="">
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
import { useSlotStore } from "@/stores/slot"
import { usePatternStore } from "@/stores/pattern"

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
  width: 120px;
  height: 120px;
  position: relative;

  cursor: pointer;
  user-select: none;

  img {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  .slotPattern {
    position: absolute;
    z-index: 10;
  }
}

.empty {
  color: #666;
}
</style>