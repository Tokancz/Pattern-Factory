<template>
  <div
    class="slot"
    :class="slotClass"
    role="button"
    :tabindex="slot.unlocked ? 0 : -1"
    :aria-label="slotLabel"
    :aria-disabled="!slot.unlocked"
    @click="handleClick"
    @keydown.enter.prevent="handleKeyActivate"
    @keydown.space.prevent="handleKeyActivate"
    @wheel.prevent="handleWheel"
  >
    <span class="slot__tag">SLOT {{ slot.id + 1 }}</span>

    <div class="slot__tile" :class="{ 'is-selected': slot.id === slots.selectedSlotId }">
      <template v-if="slot.unlocked && slot.patternId && patternData">
        <img :src="patternData.visuals.icon" :alt="slot.patternId" draggable="false">
      </template>
      <template v-else-if="slot.unlocked && !slot.patternId">
        <img src="/img/icons/connectdevelop.svg" alt="" aria-hidden="true">
      </template>
      <template v-else>
        <img src="/img/icons/lock-alert.svg" alt="" aria-hidden="true">
      </template>
    </div>

    <div class="slot__name">
      <template v-if="slot.unlocked && slot.patternId">{{ slot.patternId }}</template>
      <template v-else-if="slot.unlocked">empty · click</template>
      <template v-else>locked</template>
    </div>

    <div v-if="slot.unlocked && slot.patternId" class="slot__progress">
      <div class="slot__progressBar">
        <div class="fill" :style="{ width: progressPct + '%' }"></div>
      </div>
      <span class="slot__progressTxt">{{ Math.floor(slot.progress) }} / {{ maxProgress }}</span>
    </div>

    <div v-if="!slot.unlocked" class="slot__req">REQUIRES MACHINE</div>

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
import { useSlotStore } from "@/stores/slot"
import { usePatternStore } from "@/stores/pattern"
import { useUpgradeStore } from "@/stores/upgrade"
import { useMachineStore } from "@/stores/machine"
import { formatNumber } from "@/utils/format"
import { playSound } from "@/utils/sound"

type FloatingText = { id: number; x: number; y: number; value: string }

const floatingTexts = ref<FloatingText[]>([])
let idCounter = 0

const patternStore = usePatternStore()
const upgrades = useUpgradeStore()
const slots = useSlotStore()

const props = defineProps<{ slot: any }>()

const patternData = computed(() => {
  if (!props.slot.patternId) return null
  return PATTERNS[props.slot.patternId as keyof typeof PATTERNS]
})

const maxProgress = computed(() => {
  if (!props.slot.patternId) return 100
  return PATTERNS[props.slot.patternId as keyof typeof PATTERNS].baseProgress || 100
})

const progressPct = computed(() => {
  if (!maxProgress.value) return 0
  return Math.min(100, (props.slot.progress / maxProgress.value) * 100)
})

const slotClass = computed(() => ({
  "is-active": props.slot.unlocked && props.slot.patternId,
  "is-buy":    props.slot.unlocked && !props.slot.patternId,
  "is-locked": !props.slot.unlocked
}))

const slotLabel = computed(() => {
  if (!props.slot.unlocked) return "Locked slot"
  if (!props.slot.patternId) return "Empty slot — click to assign a pattern"
  return `${props.slot.patternId} slot — click to produce`
})

const availablePatterns = computed(() => patternStore.unlockedPatterns)

function selectPattern(patternId: string) {
  if (availablePatterns.value.includes(patternId)) {
    slots.assignPattern(props.slot.id, patternId)
  }
}

function handleKeyActivate(event: KeyboardEvent) {
  if (!props.slot.unlocked) return
  handleClick(event as unknown as MouseEvent)
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
  spawnFloatingText(event, `+${formatNumber(upgrades.getClickPower)}`)
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
  }, 1500)
}
</script>

<style scoped lang="scss">
.slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $s-3;
  position: relative;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;

  &__tag { @include chip($accent, $accent-15); margin-bottom: 2px; }

  &__tile {
    width: 116px; height: 116px;
    border-radius: $r-md;
    display: grid;
    place-items: center;
    position: relative;
    transition: transform .15s $ease, box-shadow .15s $ease;
    img {
      width: 64%;
      height: 64%;
      object-fit: contain;
    }
  }

  &__name {
    font-family: $ff-display;
    font-weight: 700;
    font-size: 16px;
    letter-spacing: .04em;
    color: $ink;
    text-transform: uppercase;
  }

  &__progress {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    width: 116px;
  }
  &__progressBar {
    @include progress(4px, $accent);
    width: 100%;
  }
  &__progressTxt {
    font-family: $ff-mono;
    font-weight: 600;
    font-size: 11px;
    color: $ink-2;
    @include tab-nums;
  }
  &__req { @include label(10px, $danger); }

  // active
  &.is-active &__tile {
    background: linear-gradient(180deg, rgba(#FFFFFF, .12) 0%, rgba(#FFFFFF, .04) 100%);
    border: 1px solid rgba($accent, .55);
    box-shadow:
      0 0 0 1px rgba($accent, .15) inset,
      0 0 24px rgba($accent, .35),
      0 12px 32px rgba(0, 0, 0, .45);
  }
  &.is-active:hover &__tile { transform: translateY(-2px); }

  // buy / empty unlocked
  &.is-buy &__tile {
    width: 92px; height: 92px;
    background: rgba($surface-2, .5);
    border: 1.5px dashed rgba($accent, .3);
    img { opacity: .35; filter: brightness(0) invert(.9); }
  }
  &.is-buy &__name { color: $ink-3; font-size: 13px; }

  // locked
  &.is-locked &__tile {
    width: 92px; height: 92px;
    background: rgba(#000, .35);
    border: 1px solid rgba($ink-4, .6);
    img { opacity: .4; }
  }
  &.is-locked &__name { color: $ink-3; font-size: 12px; }

  // selected (overclock target)
  &__tile.is-selected {
    animation: slotSelectedPulse 1.2s ease-in-out infinite;
  }
}
@keyframes slotSelectedPulse {
  0%, 100% { box-shadow: 0 0 0 1px rgba($warm, .55), 0 0 16px rgba($warm, .4); }
  50%      { box-shadow: 0 0 0 1px rgba($warm, .9),  0 0 28px rgba($warm, .7); }
}

.floating-text {
  position: absolute;
  pointer-events: none;
  font-family: $ff-display;
  font-weight: 700;
  font-size: 28px;
  color: $ink;
  text-shadow: 0 0 12px rgba($accent, .55);
  transform: translate(-50%, -50%);
  animation: floatUp 1.5s ease-out forwards;
  z-index: 10;
}
@keyframes floatUp {
  0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  50%  { transform: translate(-50%, -100%) scale(1.15); }
  100% { opacity: 0; transform: translate(-50%, -140%) scale(.85); }
}
</style>
