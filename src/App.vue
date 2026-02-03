<template>
  <main id="simulation">
    <!-- CONVEYOR -->
    <div id="belt"></div>

    <!-- PARTS -->
    <img
      v-for="part in parts"
      :key="part.id"
      :src="getPartSprite(part)"
      class="part"
      :style="partStyle(part)"
      draggable="false"
    />

    <!-- FACTORY BUTTON -->
    <button id="spawn" @click="spawnPart">Spawn</button>

    <!-- HUD -->
    <div id="hud">
      <p>Money: {{ money }} IGM</p>
      <p>Level: {{ lvl }}</p>
      <p>EXP: {{ exp }} / {{ expToNextLvl }}</p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from "vue"

/* -------------------------------------------------
   TYPES
------------------------------------------------- */
type Point = { x: number; y: number }

type Part = {
  id: number
  patternId: string
  progress: number
  speed: number
  traits: {
    color?: string
    cut?: boolean
    merged?: boolean
  }
}

type Pattern = {
  id: string
  baseValue: number
  baseExp: number
}

type Machine = {
  at: number // progress position (0–1)
  apply(part: Part): Part
}

/* -------------------------------------------------
   STATE
------------------------------------------------- */
const money = ref(0)
const lvl = ref(1)
const exp = ref(0)
const expToNextLvl = ref(100)

const parts = ref<Part[]>([])
let partId = 0

/* -------------------------------------------------
   CONVEYOR PATH (ANY SHAPE)
------------------------------------------------- */
const conveyorPath: Point[] = [
  { x: 100, y: 50 },
  { x: 100, y: 200 },
  { x: 250, y: 200 }, // turn
  { x: 250, y: 350 }
]

/* -------------------------------------------------
   PATTERNS (BLUEPRINTS)
------------------------------------------------- */
const patterns: Record<string, Pattern> = {
  basic: {
    id: "basic",
    baseValue: 1,
    baseExp: 2
  }
}

/* ------------------------------------------------
   MACHINES (TRANSFORMATIONS)
------------------------------------------------- */
const machines: Machine[] = [
  {
    at: 0.4,
    apply(part) {
      if (part.traits.color) return part
      return {
        ...part,
        traits: { ...part.traits, color: "red" }
      }
    }
  },
  {
    at: 0.7,
    apply(part) {
      if (part.traits.cut) return part
      return {
        ...part,
        traits: { ...part.traits, cut: true }
      }
    }
  }
]

/* -------------------------------------------------
   SPAWN
------------------------------------------------- */
function spawnPart() {
  parts.value.push({
    id: partId++,
    patternId: "basic",
    progress: 0,
    speed: 0.003,
    traits: {}
  })
}

/* -------------------------------------------------
   PATH INTERPOLATION (CORE FIX)
------------------------------------------------- */
function getPositionOnPath(path: Point[], progress: number) {
  const segments = path.length - 1
  const segProgress = progress * segments
  const index = Math.floor(segProgress)
  const t = segProgress - index

  const p1 = path[index]
  const p2 = path[index + 1] ?? p1

  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t
  }
}

function partStyle(part: Part) {
  const pos = getPositionOnPath(conveyorPath, part.progress)
  return {
    transform: `translate(${pos.x}px, ${pos.y}px)`
  }
}

/* -------------------------------------------------
   VISUAL RESOLUTION
------------------------------------------------- */
function getPartSprite(part: Part) {
  if (part.traits.cut && part.traits.color) return "/img/CircleRedCut.png"
  if (part.traits.cut) return "/img/CircleCut.png"
  if (part.traits.color) return "/img/CircleRed.png"
  return "/img/Circle.png"
}

/* -------------------------------------------------
   ECONOMY
------------------------------------------------- */
function calculateValue(part: Part) {
  let value = patterns[part.patternId].baseValue

  if (part.traits.color) value *= 1.25
  if (part.traits.cut) value *= 1.5
  if (part.traits.merged) value *= 2

  return Math.floor(value)
}

function calculateExp(part: Part) {
  return patterns[part.patternId].baseExp +
    Object.keys(part.traits).length
}

/* -------------------------------------------------
   SELL & LEVEL
------------------------------------------------- */
function sellPart(part: Part) {
  money.value += calculateValue(part)
  gainExp(calculateExp(part))
}

function gainExp(amount: number) {
  exp.value += amount
  if (exp.value >= expToNextLvl.value) {
    exp.value = 0
    lvl.value++
    expToNextLvl.value = Math.floor(expToNextLvl.value * 1.5)
  }
}

/* -------------------------------------------------
   GAME LOOP
------------------------------------------------- */
setInterval(() => {
  parts.value.forEach((part, index) => {
    part.progress += part.speed

    // apply machines
    machines.forEach(machine => {
      if (
        part.progress >= machine.at &&
        !(part as any)[`m_${machine.at}`]
      ) {
        Object.assign(part, machine.apply(part))
        ;(part as any)[`m_${machine.at}`] = true
      }
    })

    // sell
    if (part.progress >= 1) {
      sellPart(part)
      parts.value.splice(index, 1)
    }
  })
}, 16)
</script>