<template>
    <header>
        <div id="header_info">
            <img src="/img/Header.png" alt="Header" draggable="false">
            <h1>{{ factoryName }}</h1>
            <div>
                <p id="user">{{ userName }}</p>
                <p>Level: {{ lvl }}</p>
                <p>EXP: {{ exp }} / {{ expToNextLvl }}</p>
            </div>
        </div>
    </header>
    <main>
        <aside id="stats">
            <section>
                <h3>Stats</h3>
                <p>Income: 0 IGM/s</p>
                <p>Idle: 0 IGM/h</p>
                <p>Parts Sold: </p>
            </section>
            <section>
                <h3>Progress</h3>
                <p>Next Part:  %</p>
                <input type="range" min="0" max="100" class="slider" v-model="parts.progress" disabled="true">
                <p>Part Price: IGM</p>
            </section>
            <section>
                <h3>Daily Pattern</h3>
                <p>Price: IGM</p>
                <img alt="Daily Pattern" id="daily_pattern">
            </section>
        </aside>
        <section id="simulation">
            <div @click="spawnPart" id="factory">
                <img src="/img/Factory.png" alt="Factory" draggable="false">
                <img alt="Pattern" id="pattern" draggable="false">
                <p id="progress">Progress %</p>
            </div>
            <div id="belt"></div>
            <img src="/img/Seller.png" alt="Seller" id="seller" draggable="false">
            <!-- PARTS -->
            <img
                v-for="part in parts"
                :key="part.id"
                :src="getPartSprite(part)"
                class="part"
                :style="partStyle(part)"
                draggable="false"
            />
        </section>
        <section id="shop">
            <img src="/img/Shop.png" alt="shopBG" draggable="false">
            <aside>
                <div class="shop_header">
                    <h2>SHOP</h2>
                    <img src="/img/ShoppingCart.png" alt="Shop Icon" draggable="false">
                </div>
                <div class="shop_buttons">
                    <button class="shop_button">Patterns</button>
                    <button class="shop_button">Tools</button>
                    <button class="shop_button">Upgrades</button>
                    <button class="shop_button">Prestige</button>
                </div>
            </aside>
        </section>
    </main>
    <footer>
        <img src="/img/Footer.png" alt="Footer" draggable="false">
        <p>Money: {{ money }} IGM</p>
    </footer>
</template>

<script setup lang="ts">
import { ref } from "vue"

//TYPES
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
  traits: {
    color?: string
    cut?: boolean
    merged?: boolean
  }
}

type Machine = {
  at: number // progress position (0–1)
  apply(part: Part): Part
}

//STATE
const factoryName = ref("Pattern Factory")
const userName = ref("Player")

const money = ref(localStorage.getItem("money") ? parseInt(localStorage.getItem("money")!) : 0)
const lvl = ref(localStorage.getItem("lvl") ? parseInt(localStorage.getItem("lvl")!) : 1)
const exp = ref(localStorage.getItem("exp") ? parseInt(localStorage.getItem("exp")!) : 0)
const expToNextLvl = ref(localStorage.getItem("expToNextLvl") ? parseInt(localStorage.getItem("expToNextLvl")!) : 100)

const parts = ref<Part[]>([])
let partId = 0

//CONVEYOR PATH (ANY SHAPE)
const conveyorPath: Point[] = [
  { x: 0, y: 120 },
  { x: 0, y: 500 },
]

//PATTERNS (BLUEPRINTS) LIST OF ALL PATTERN TYPES
const patterns: Record<string, Pattern> = {
  basic: {
    id: "basic",
    baseValue: 1,
    baseExp: 2,
    traits: {
        color: undefined,
        cut: false,
        merged: false
    }
  },
  redCircle: {
    id: "redCircle",
    baseValue: 5,
    baseExp: 3,
    traits: {
        color: "red",
        cut: false,
        merged: false
    }
  },
}

const currentPattern = ref<Pattern>(patterns.basic);

//MACHINES
const machines: Machine[] = [
  {
    at: 0.4, //COLOR MACHINE
    apply(part) {
      if (part.traits.color) return part
      return {
        ...part,
        traits: { ...part.traits, color: currentPattern.value.traits.color }
      }
    }
  },
  {
    at: 0.7, //CUTTING MACHINE
    apply(part) {
      if (part.traits.cut) return part
      return {
        ...part,
        traits: { ...part.traits, cut: currentPattern.value.traits.cut }
      }
    }
  }
]

function spawnPart() {
  parts.value.push({
    id: partId++,
    patternId: "basic",
    progress: 0,
    speed: 0.01,
    traits: {}
  })
}

//PATH INTERPOLATION (CORE FIX)
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

//VISUAL RESOLUTION -- NEEDS REWORK
function getPartSprite(part: Part) {
  if (part.traits.cut && part.traits.color) return "/img/CircleRedCut.png"
  if (part.traits.cut) return "/img/CircleCut.png"
  if (part.traits.color) return "/img/CircleRed.png"
  return "/img/Circle.png"
}

//VALUE CALCULATION AND EXP CALCULATION
function calculateValue(part: Part) {
  let value = currentPattern.value.baseValue
  return Math.floor(value)
}
function calculateExp(part: Part) {
  return currentPattern.value.baseExp
}

//SELL & LEVEL
function sellPart(part: Part) {
  money.value += calculateValue(part)
  localStorage.setItem("money", money.value.toString())
  gainExp(calculateExp(part))
}

function gainExp(amount: number) {
  exp.value += amount
  if (exp.value >= expToNextLvl.value) {
    exp.value = 0
    lvl.value++
    expToNextLvl.value = Math.floor(expToNextLvl.value * 1.5)
  }
  localStorage.setItem("exp", exp.value.toString())
  localStorage.setItem("lvl", lvl.value.toString())
  localStorage.setItem("expToNextLvl", expToNextLvl.value.toString())
}

//GAME LOOP
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
    /*
    document.addEventListener('mousemove', (event) => {
        console.log(`Mouse X: ${event.clientX}, Mouse Y: ${event.clientY}`);
    });*/
}, 50)
</script>