<template>
  <div class="slot" :class="{ locked: !slot.unlocked }" @click="handleClick">
    <img src="/img/Slot.png" alt="slot background" aria-hidden="true">
    
    <div v-if="slot.patternId" class="slotPattern">
      <img v-if="patternData" :src="patternData.visuals.slot" alt="pattern image" draggable="false">
      <div>{{ slot.patternId.toUpperCase() }}</div>
      <div class="progressBar">{{ bar }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { PATTERNS } from "@/data/patterns"
import { generateBar } from "@/utils/ascii"
import { useSlotStore } from "@/stores/slot"
import { usePatternStore } from "@/stores/pattern"

const patternStore = usePatternStore()

const props = defineProps<{
  slot: any
}>()

const slots = useSlotStore()

const patternData = computed(() => {
  if (!props.slot.patternId) return null
  return PATTERNS[props.slot.patternId]
})

const bar = computed(() =>
  generateBar(props.slot.progress, slots.maxProgress, 8)
)

function handleClick() {
  if (!props.slot.unlocked) return

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

  > img {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  .slotPattern {
    width: 100%;
    height: 100%;
    position: absolute;
    @include flexColumn(5px, center, center);
    z-index: 10;

    > img {
      width: 60%;
      height: 60%;
      user-select: none;
    }
    .progressBar {
      position: absolute;
      bottom: -60px;
      left: 50%;
      width: 100px;

      transform: translateX(-50%);
      text-align: center;
    }
  }
}

.locked {
  opacity: 0.3;
  pointer-events: none;
}
</style>