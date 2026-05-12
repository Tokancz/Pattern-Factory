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
import { useGlyphStore } from "@/stores/glyph"
import { formatNumber } from "@/utils/format"
import { playSound } from "@/utils/sound"

// Per-thread Cross click cooldown (Echo of the Cross). Module-level so
// the cooldown persists if the slot remounts. Maps slot id → next-allowed
// timestamp (ms). Keyed by id — a thread that swaps to a non-cross
// pattern still keeps its remaining cooldown if it swaps back.
const crossCooldowns = new Map<number, number>()

// Cooldown shrinks with the Cross Resolution Glyph upgrade (Tier 3).
// Levels: 0 = 5s, 1 = 3s, 2 = 2s, 3 = 1s.
function crossCooldownMs(): number {
  const glyph = useGlyphStore()
  const lvl = glyph.upgradeLevel("crossResolution")
  switch (lvl) {
    case 1:  return 3_000
    case 2:  return 2_000
    case 3:  return 1_000
    default: return 5_000
  }
}

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
  if (!props.slot.unlocked) return "Locked thread"
  if (!props.slot.patternId) return "Empty thread — click to assign a pattern"
  return `${props.slot.patternId} thread — click to render`
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
      spawnFloatingText(event, "Module required")
      playSound("error")
      return
    }
    // Γ threads can't be overclocked — surface the reason instead of
    // letting the click silently no-op.
    if (props.slot.patternId === "glyph") {
      spawnFloatingText(event, "Γ resists overclock")
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

  // Cross handling: blocked by default, unlocked by Echo of the Cross
  // with a per-thread cooldown.
  if (props.slot.patternId === "cross") {
    const glyph = useGlyphStore()
    if (!glyph.hasUpgrade("echoOfTheCross")) return

    const now = Date.now()
    const next = crossCooldowns.get(props.slot.id) ?? 0
    if (now < next) {
      const remaining = ((next - now) / 1000).toFixed(1)
      spawnFloatingText(event, `${remaining}s`)
      playSound("error")
      return
    }
    crossCooldowns.set(props.slot.id, now + crossCooldownMs())
  }

  // Glyph is fully auto-only with no escape upgrade. Bail before the
  // click sound / floating-text path so the player doesn't get a fake
  // "+N" they didn't earn.
  if (props.slot.patternId === "glyph") {
    playSound("error")
    return
  }

  slots.clickSlot(props.slot.id)
  playSound("click")
  spawnFloatingText(event, `+${ formatNumber(upgrades.getClickPower) }`)

  // Recursive Click (Tier 4): the click cascades to adjacent unlocked
  // threads. Adjacency is by slot id ±1 (the visual grid order), so a
  // click on thread 2 also fires threads 1 and 3 if both are unlocked.
  // The recursive fires don't recurse — single-bounce only.
  const glyph = useGlyphStore()
  if (glyph.hasUpgrade("recursiveClick")) {
    for (const offset of [-1, 1]) {
      const adj = slots.slots.find(s => s.id === props.slot.id + offset)
      if (adj?.unlocked && adj.patternId) slots.clickSlot(adj.id)
    }
  }
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