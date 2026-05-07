<template>
  <div
    class="slot"
    :class="{ locked: !slot.unlocked, flash: slotFlash }"
    role="button"
    :tabindex="slot.unlocked ? 0 : -1"
    :aria-label="slotLabel"
    :aria-disabled="!slot.unlocked"
    @click="handleClick"
    @keydown.enter.prevent="handleKeyActivate"
    @keydown.space.prevent="handleKeyActivate"
    @wheel.prevent="handleWheel"
  >
    <img src="/img/Slot.png" alt="" aria-hidden="true" :class="{selected: slot.id === slots.selectedSlotId }">

    <div v-if="slot.patternId" class="slotPattern">
      <img v-if="patternData" :src="patternData.visuals.slot" :alt="slot.patternId" draggable="false">
      <p aria-hidden="true">{{ slot.patternId.toUpperCase() }}</p>
      <p class="progressBar" aria-hidden="true">{{ bar }}</p>
    </div>

    <img v-else class="empty" src="/img/icons/lock-alert.svg" alt="" aria-hidden="true">

    <div
      v-for="text in floatingTexts"
      :key="text.id"
      class="floating-text"
      aria-hidden="true"
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
import { playSound } from "@/utils/sound"

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

const slotLabel = computed(() => {
  if (!props.slot.unlocked) return "Locked slot"
  if (!props.slot.patternId) return "Empty slot — click to assign a pattern"
  return `${props.slot.patternId} slot — click to produce`
})

function handleKeyActivate(event: KeyboardEvent) {
  if (!props.slot.unlocked) return
  handleClick(event as unknown as MouseEvent)
}

const availablePatterns = computed(() => patternStore.unlockedPatterns)

function selectPattern(patternId: string) {
  if (availablePatterns.value.includes(patternId)) {
    slots.assignPattern(props.slot.id, patternId)
  }
}

function handleClick(event: MouseEvent) {
  if (!props.slot.unlocked) {
    playSound("error")
    return
  }

  const machines = useMachineStore()

  if (event.shiftKey) {
    if (machines.getLevel("targetedBoost") < 1) {
      spawnFloatingText(event, "Machine required")
      playSound("error")
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
  playSound("click")
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
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  cursor: pointer;
  user-select: none;

  @include bp("xs") { width: 100px; height: 100px; }

  > img {
    position: absolute;
    width: 100%;
    height: 100%;
  }

  .slotPattern {
    @include flexColumn(5px, center, center);
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: 10;

    > img {
      width: 60%;
      height: 60%;
      user-select: none;
    }

    p {
      font-size: 1em;
      @include bp("md") { font-size: .8em; }
    }

    .progressBar {
      position: absolute;
      bottom: -50px;
      left: 50%;
      width: 100px;
      transform: translateX(-50%);
      text-align: center;

      @include bp("md") { font-size: .9em; width: 80px; bottom: -40px; }
    }
  }

  .empty {
    position: absolute;
    width: 60%;
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