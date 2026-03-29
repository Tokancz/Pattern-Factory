<template>
  <div
    class="slot"
    :class="{ locked: !slot.unlocked, flash: slotFlash }"
    @click="handleClick"
    @wheel.prevent="handleWheel"
  >
    <img src="/img/Slot.png" alt="slot background" aria-hidden="true" :class="{selected: slot.id === slots.selectedSlotId }">

    <div v-if="slot.patternId" class="slotPattern">
      <img v-if="patternData" :src="patternData.visuals.slot" alt="pattern image" draggable="false">
      <p>{{ slot.patternId.toUpperCase() }}</p>
      <p class="progressBar">{{ bar }}</p>
    </div>

    <img v-else class="empty" src="/img/icons/lock-alert.svg" alt="empty slot" aria-hidden="true">

    <div
      v-for="text in floatingTexts"
      :key="text.id"
      class="floating-text"
      :style="{ left: text.x + 'px', top: text.y + 'px' }"
    >
      {{ text.value }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { PATTERNS } from "@/data/patterns"
import { generateBar } from "@/utils/ascii"
import { useSlotStore } from "@/stores/slot"
import { usePatternStore } from "@/stores/pattern"
import { useUpgradeStore } from "@/stores/upgrade"
import { useMachineStore } from "@/stores/machine"
import { formatNumber } from "@/utils/format"

type FloatingText = {
  id: number
  x: number
  y: number
  value: string
}

const floatingTexts = ref<FloatingText[]>([])
let idCounter = 0

const patternStore = usePatternStore()
const upgrades = useUpgradeStore()
const slots = useSlotStore()

const props = defineProps<{
  slot: any
}>()

const slotFlash = ref(false)

const patternData = computed(() => {
  if (!props.slot.patternId) return null
  return PATTERNS[props.slot.patternId as keyof typeof PATTERNS]
})

const maxProgress = computed(() => {
  if (!props.slot.patternId) return 100
  return PATTERNS[props.slot.patternId as keyof typeof PATTERNS].baseProgress || 100
})

const bar = computed(() =>
  generateBar(props.slot.progress, maxProgress.value, 8)
)

const availablePatterns = computed(() => patternStore.unlockedPatterns)

function selectPattern(patternId: string) {
  if (availablePatterns.value.includes(patternId)) {
    slots.assignPattern(props.slot.id, patternId)
  }
}

function handleClick(event: MouseEvent) {
  if (!props.slot.unlocked) return

  const machines = useMachineStore()

  if (event.shiftKey) {
    if (machines.getLevel("targetedBoost") < 1) {
      spawnFloatingText(event, "Machine required")
      return
    }
    slots.selectSlot(props.slot.id)
    return
  }

  if (!props.slot.patternId) {
    const firstPattern = availablePatterns.value[0]
    if (firstPattern) selectPattern(firstPattern)
    return
  }

  if (props.slot.patternId === "cross") return

  slots.clickSlot(props.slot.id)
  spawnFloatingText(event, `+${ formatNumber(upgrades.getClickPower) }`)
}

function handleWheel(event: WheelEvent) {
  if (!props.slot.unlocked || availablePatterns.value.length === 0) return

  const currentIndex = availablePatterns.value.indexOf(props.slot.patternId || "")
  const delta = event.deltaY > 0 ? 1 : -1
  const nextIndex = (currentIndex + delta + availablePatterns.value.length) % availablePatterns.value.length

  const nextPattern = availablePatterns.value[nextIndex]
  if (nextPattern) selectPattern(nextPattern)
}

function spawnFloatingText(event: MouseEvent, value: string) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const id = idCounter++

  floatingTexts.value.push({
    id,
    x: event.clientX - rect.left + (Math.random() - 0.5) * 20,
    y: event.clientY - rect.top + (Math.random() - 0.5) * 10,
    value
  })

  setTimeout(() => {
    floatingTexts.value = floatingTexts.value.filter(t => t.id !== id)
  }, 2000)
}
</script>

<style scoped lang="scss">
.slot {
  width: 120px;
  height: 120px;
  position: relative;
  flex-shrink: 0;

  cursor: pointer;
  user-select: none;

  @media (width <= 425px) {
    width: 100px;
    height: 100px;
  }

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

    p {
      font-size: 1em;

      @media (width <= 768px) {
        font-size: .8em;
      }
    }

    .progressBar {
      position: absolute;
      bottom: -50px;
      left: 50%;
      width: 100px;

      transform: translateX(-50%);
      text-align: center;

      @media (width <= 768px) {
        font-size: .9em;
        width: 80px;
        bottom: -40px;
      }
    }
  }

  .empty {
    width: 60%;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
}

.locked {
  opacity: 0.5;
  pointer-events: none;
}

.selected {
  position: relative;
  animation: pulse 1.2s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    filter: drop-shadow(0 0 6px var(--primary));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 18px var(--primary));
    transform: scale(1.05);
  }
  100% {
    filter: drop-shadow(0 0 6px var(--primary));
    transform: scale(1);
  }
}

.floating-text {
  position: absolute;
  pointer-events: none;
  font-weight: bold;
  color: var(--primary);
  transform: translate(-50%, -50%);
  animation: floatUp 1.5s ease-out forwards;
  z-index: 10;
}

@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -80%) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -120%) scale(0.8);
  }
}
</style>