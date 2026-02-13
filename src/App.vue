<template>
    <header>
        <div id="header_info">
            <img src="/img/Header.png" alt="Header" draggable="false">
            <h1>{{ factoryName }}</h1>
            <div>
                <p id="user">{{ userName }}</p>
                <p>Level: {{ lvl }}</p>
                <p>EXP: {{ formatNumber(exp) }}/ {{ formatNumber(expToNextLvl) }}</p>
            </div>
            <p v-if="lvlPopUp"> + {{ gainedMoney }} IGM</p>
        </div>
    </header>
    <main>
        <aside id="stats">
            <section>
                <h3>Stats</h3>
                <p>Idle: {{ formatNumber(Math.floor(idleIncomePerSecond * 100) / 100) }} IGM/s</p>
                <p>Parts Sold: {{ formatNumber(partsSold) }}</p>
            </section>
            <section>
                <h3>Progress</h3>
                <p>Next Part: {{ Math.floor(creatingProgress / currentPattern.creationTime * 100) }} %</p>
                <input type="range" min="0" :max="currentPattern.creationTime" class="slider" v-model="creatingProgress" disabled="true">
                <p>Initial Price: {{ formatNumber(currentPattern.baseValue) }} IGM</p>
                <p>Current Price: {{ displayValue(currentPattern) }} IGM</p>
            </section>
            <section>
                <h3>Daily Pattern</h3>
                <p>1.5x mutliplier !!</p>
                <p>Price: {{ displayValue(dailyPattern) }} IGM</p>
                <p>DC: 10 DC</p>
                <svg v-if="dailyPattern?.traits"
                  viewBox="0 0 32 32"
                  draggable="false"
                  :style="{ fill: dailyPattern.traits.color }"
                  v-html="shapes[dailyPattern.traits.shape]">
                </svg>
            </section>
        </aside>
        <section id="simulation">
            <div @click="click" id="factory">
                <img src="/img/Factory.png" alt="Factory" draggable="false">
                <svg viewBox="0 0 32 32" 
                  :style="{fill: currentPattern.traits.color}" 
                  v-html="shapes[currentPattern.traits.shape]">
                </svg>
                <p id="progress">Progress {{ Math.floor(creatingProgress / currentPattern.creationTime * 100) }} %</p>
            </div>

            <div id="belt"></div>

            <img v-for="machine in machines" v-show="machine.owned" 
                :src="machine.src" 
                :style="machinePos(machine)" 
            alt="machine" class="machine">

            <img src="/img/Seller.png" alt="Seller" id="seller" draggable="false">

            <svg viewBox="0 0 32 32"
                v-for="part in parts"
                :key="part.id"
                class="part"
                :style="partStyle(part)"
                v-html="shapes[part.traits.cut!]">
            </svg>
        </section>
        <section id="shopList">
            <img src="/img/Shop.png" alt="shopBG" draggable="false">
            <aside>
                <div class="shop_header">
                    <h2>SHOP</h2>
                    <img src="/img/ShoppingCart.png" alt="Shop Icon" draggable="false">
                </div>
                <div class="shop_buttons">
                    <button class="button" @click="openedShop = 'patterns'">Patterns</button>
                    <button class="button" @click="openedShop = 'machines'">Machines</button>
                    <button class="button" @click="openedShop = 'upgrades'">Upgrades</button>
                    <button class="button" @click="openedShop = 'prestige'">Prestige</button>
                </div>
                <button class="button" @click="openedShop = 'inventory'">Inventory</button>
            </aside>
        </section>
        <section class="tab" v-if="openedShop === 'patterns'">
            <div class="shop_header">
                <h4>Pattern Shop</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <div class="container">
                <div class="pattern" v-for="pattern in patterns" :key="pattern.id" v-show="canProducePattern(pattern) && !pattern.owned">
                    <svg viewBox="0 0 32 32" 
                      :style="{fill: pattern.traits.color}"
                      v-html="shapes[pattern.traits.shape]">
                    </svg>
                    <p>Value: {{ displayValue(pattern) }}</p>
                    <p>Exp:  {{ formatNumber(pattern.baseExp) }}</p>
                    <p>Creation time:  {{ formatNumber(pattern.creationTime) }}</p>
                    <button v-if="!pattern.owned" @click="buyPattern(pattern)">Price: {{ formatNumber(pattern.price) }} IGM</button>
                     <button v-else>Owned</button>
                </div>
            </div>
            <p v-if="ownedPatterns.length % Object.keys(colors).length === 0">Nothing else to buy. Try buying a new machine or upgrade</p><!--Fix-->
        </section>
        <section class="tab" v-if="openedShop === 'machines'">
            <div class="shop_header">
                <h4>Machines Shop</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <div class="container">
                <div class="pattern" v-for="machine in machines" :key="machine.id">
                    <p>{{ machine.description }}</p>
                    <img :src="machine.src" alt="">
                    <button v-if="!machine.owned" @click="buyMachine(machine)">Price: {{ formatNumber(machine.price) }} IGM</button>
                    <button v-else>Owned</button>
                </div>
            </div>
        </section>
        <section class="tab" v-if="openedShop === 'upgrades'">
            <div class="shop_header">
                <h4>Upgrade</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <div class="container">
                <div class="upgrade" v-for="upgrade in upgrades">
                    <p>{{ upgrade.id + " lvl: " + upgrade.lvl}}</p>
                    <p>Cost: {{ formatNumber(upgrade.value) }}</p>
                    <button class="buy_button" @click="buyUpgrade(upgrade)">Buy</button>
                </div>
            </div>
        </section>
        <section class="tab" v-if="openedShop === 'prestige'">
            <div class="shop_header">
                <h4>Prestige</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <p>Prestige will remove your current money, patterns and machines but will grant you permanent bonuses!!</p>
            <button v-if="calculatePrestigeReward() > 1" @click="prestige">Prestige (Gain {{ calculatePrestigeReward() }} PP)</button>
        </section>
        <section class="tab" v-if="openedShop === 'inventory'">
            <div class="shop_header">
                <h4>Inventory</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <div class="container">
                <div class="pattern" v-for="pattern in patternList" :key="pattern.id" :disabled="!canProducePattern(pattern)" v-show="pattern.owned" @click="setPattern(pattern)">
                    <svg viewBox="0 0 32 32" 
                      :style="{fill: pattern.traits.color}"
                      v-html="shapes[pattern.traits.shape]">
                    </svg>
                    <p>Price: {{ displayValue(pattern) }}</p>
                    <p>Exp: {{ formatNumber(pattern.baseExp) }}</p>
                    <p>Creation time: {{ formatNumber(pattern.creationTime) }}</p>
                    <button v-if="currentPattern.id !== pattern.id"  @click="setPattern(pattern)">Select</button>
                    <button v-if="currentPattern.id == pattern.id">Selected</button>
                </div>
            </div>
        </section>
        <div v-if="showOfflinePopup" id="offlineReward">
            <p @click="closeOfflinePopup" class="close">X</p>
            <h3>Welocme back!</h3>
            <p>While you were away you earned {{ formatNumber(offlineReward) }} IGM</p>
        </div>
    </main>
    <footer>
        <img src="/img/Footer.png" alt="Footer" draggable="false">
        <p id="money">Money: {{ formattedMoney }} IGM</p>
        <p id="dc">DC: {{ formatNumber(dc) }}</p>
    </footer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"

type Point = { x: number; y: number }

type Part = {
  id: number
  patternId: string
  progress: number
  speed: number
  traits: {
    color?: string
    cut?: string
    merged?: boolean
  }
}
type Pattern = {
  id: string
  baseValue: number
  baseExp: number
  creationTime: number
  price: number
  owned: boolean
  requirements: {
    color?: boolean
    cut?: boolean
    merged?: boolean
  }
  traits: {
    color: string
    shape: string
  }
}
type Machine = {
  id: string
  description?: string
  at: number
  price: number
  owned: boolean
  src: string
  apply(part: Part): Part
}
type Upgrade = {
    id: string
    lvl: number
    value: number
    power: number
}
type Upgrades = {
  clickingPower: Upgrade
  creationSpeed: Upgrade
  sellMultiplier: Upgrade
}
type Colors = {
  gray: string
  red: string
  blue: string
  green: string
  yellow: string
  purple: string
  brown: string
}

const openedShop = ref("")
const money = ref(localStorage.getItem("money") ? parseInt(localStorage.getItem("money")!) : 0)
const dc = ref(localStorage.getItem("dc") ? parseInt(localStorage.getItem("dc")!) : 0)
const prestigePoints = ref<number>(Number(localStorage.getItem("prestigePoints")) || 0)

const prestigeMultiplier = ref<number>(Number(localStorage.getItem("prestigeMultiplier")) || 1)

const lvl = ref(localStorage.getItem("lvl") ? parseInt(localStorage.getItem("lvl")!) : 1)
const exp = ref(localStorage.getItem("exp") ? parseInt(localStorage.getItem("exp")!) : 0)
const expToNextLvl = ref(localStorage.getItem("expToNextLvl") ? parseInt(localStorage.getItem("expToNextLvl")!) : 100)

const parts = ref<Part[]>([])
let partId = 0

const creatingProgress = ref<number>(0);
const partsSold = ref(localStorage.getItem("partsSold") ? parseInt(localStorage.getItem("partsSold")!) : 0);

const factoryName = ref(localStorage.getItem("factoryName"))
const userName = ref(localStorage.getItem("userName"))

const conveyorPath: Point[] = [
  { x: 0, y: 120 },
  { x: 0, y: 500 },
]

const colors: Colors = {
  gray: "#cdcdcd",
  red: "#ff4d4d",
  blue: "#85a7ff",
  green: "#4ddf88",
  yellow: "#ffd972",
  purple: "#9858ed",
  brown: "#7a5901"
}

const shapes: Record<string, string> = {
  circle: `
    <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
    <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
    <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
  `,
  circleHalf: `
    <g transform="matrix(0.969044,0,0,0.937337,1.002611,1.065274)"><path d="M15.52,0L15.52,32C6.954,32 0,24.831 0,16C0,7.169 6.954,0 15.52,0Z"/></g>
    <path d="M1.003,16L16,16.063"/>
  `,
  diagonal: `
    <g transform="matrix(0.466943,0.466943,-0.466943,0.466943,16.057836,1.057122)"><rect x="1.003" y="1.065" width="29.872" height="29.995"/></g>
    <g transform="matrix(1.818334,0.003438,0.003438,1.000014,0.48632,-0.003679)"><path d="M1.003,16L16,16.063"/></g>
    <g transform="matrix(-0.004201,-1.818333,0.999991,-0.007639,0.004355,31.581012)"><path d="M1.003,16L16,16.063"/></g>
  `,
  diagonalHalf: `
    <path d="M16.029,2.023L16,29.977L2.023,16L16.029,2.023Z"/>
    <g transform="matrix(0.909176,-0.000382,-0.000382,0.999998,1.459314,0.000408)"><path d="M1.003,16L16,16.063"/></g>
  `
}

const upgrades: Upgrades = {
  clickingPower: {
    id: "Clicking Power",
    lvl: 1,
    value: 50,
    power: 25
  },
  creationSpeed: {
    id: "Creation Speed",
    lvl: 1,
    value: 100,
    power: 1
  },
  sellMultiplier: {
    id: "Sell Mutliplier",
    lvl: 1,
    value: 100,
    power: 1
  }
}

import ColorMachine from "./assets/img/ColorMachine.png"
import CutMachine from "./assets/img/CutMachine.png"

const machines: Machine[] = [
  {
    id: "color",
    description: "Color Machine",
    at: 0.3,
    price: 50,
    owned: false,
    src: ColorMachine,
    apply(part) {
      return {
        ...part,
        traits: {
          ...part.traits,
          color: patterns[part.patternId]?.traits.color
        }
      }
    }
  },
  {
    id: "cut",
    description: "Cutting Machine",
    at: 0.65,
    price: 25000,
    owned: false,
    src: CutMachine,
    apply(part) {
      return {
        ...part,
        traits: {
          ...part.traits,
          cut: patterns[part.patternId]?.traits.shape
        }
      }
    }
  }
]

//Procedural Patterns:
const colorDefs = [
  { key: "gray", requiresColor: false },
  { key: "red", requiresColor: true },
  { key: "blue", requiresColor: true },
  { key: "green", requiresColor: true },
  { key: "yellow", requiresColor: true },
  { key: "purple", requiresColor: true },
  { key: "brown", requiresColor: true }
] as const //remove Brown_!!!!

const shapeDefs = [
  { key: "circle", requiresCut: false, valueMul: 1 },
  { key: "circleHalf", requiresCut: true, valueMul: 3 },
  { key: "diagonal", requiresCut: false, valueMul: 5 },
  { key: "diagonalHalf", requiresCut: true, valueMul: 7 }
] as const

const BASE = {
  value: 2,
  exp: 2,
  creationTime: 100,
  price: 0
}
const SCALE = {
  value: 2.5,
  exp: 2,
  creationTime: 1.5,
  price: 3.5
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function generatePatterns(): Record<string, Pattern> {
  const patterns: Record<string, Pattern> = {}
  let tier = 0

  for (const shape of shapeDefs) {
    for (const color of colorDefs) {

      // --- ID generation ---
      const isBasic = color.key === "gray" && shape.key === "circle"

      const id = isBasic
        ? "basic"
        : `${color.key}${capitalize(shape.key)}`

      // --- scaling ---
      const valueTier = Math.pow(SCALE.value, tier)
      const expTier = Math.pow(SCALE.exp, tier)
      const timeTier = Math.pow(SCALE.creationTime, tier)
      const priceTier = Math.pow(SCALE.price, tier)

      const baseValue = Math.floor(BASE.value * valueTier * shape.valueMul)
      const baseExp = Math.floor(BASE.exp * expTier)
      const creationTime = Math.floor(BASE.creationTime * timeTier)

      const price = isBasic
        ? 0
        : Math.floor(priceTier * 100)

      patterns[id] = {
        id,
        baseValue,
        baseExp,
        creationTime,
        price,
        owned: isBasic,
        requirements: {
          ...(color.requiresColor ? { color: true } : {}),
          ...(shape.requiresCut ? { cut: true } : {})
        },
        traits: {
          color: colors[color.key],
          shape: shape.key
        }
      }
      tier++
    }
  }
  return patterns
}

const patterns: Record<string, Pattern> = generatePatterns()

Object.values(upgrades).forEach(upgrade => {
  const saved = localStorage.getItem(`upgrade_${upgrade.id}`)
  if (saved) {
    Object.assign(upgrade, JSON.parse(saved))
  }
})
const ownedPatterns = ref<string[]>(
  JSON.parse(localStorage.getItem("ownedPatterns") || "[]")
)
const ownedMachines = ref<string[]>(
  JSON.parse(localStorage.getItem("ownedMachines") || "[]")
)

const patternList = computed(() => Object.values(patterns))
Object.values(patterns).forEach(pattern => {
  pattern.owned =
    pattern.owned || ownedPatterns.value.includes(pattern.id)
})

Object.values(machines).forEach(machine => {
  machine.owned =
    machine.owned || ownedMachines.value.includes(machine.id)
})

function getStoredPattern(
  key: string | null,
  patterns: Record<string, Pattern>
): Pattern {
  if (key && key in patterns) {
    return patterns[key]!
  }
  return patterns.basic!
}

const storeCurrentPattern = localStorage.getItem("currentPattern")

const currentPattern = ref<Pattern>(
  getStoredPattern(storeCurrentPattern, patterns)
)

const DAILY_INTERVAL = 30 * 60 * 1000 // 30 minutes

function getEligiblePatterns(): Pattern[] {
  return Object.values(patterns).filter(p => p.id !== "basic")
}

function getDailyPattern(): Pattern {
  const now = Date.now()

  const saved = localStorage.getItem("dailyPattern")
  const savedTime = Number(localStorage.getItem("dailyPatternTime"))

  if (
    saved &&
    savedTime &&
    now - savedTime < DAILY_INTERVAL &&
    patterns[saved]
  ) {
    return structuredClone(patterns[saved])
  }

  const pool = getEligiblePatterns()

  if (pool.length === 0) {
    return structuredClone(patterns.basic)!
  }

  const random = pool[Math.floor(Math.random() * pool.length)]

  localStorage.setItem("dailyPattern", random!.id)
  localStorage.setItem("dailyPatternTime", now.toString())

  return structuredClone(random)!
}

const dailyPattern = ref<Pattern>(getDailyPattern());
dailyPattern.value.baseValue *= 1.5;

function calculatePrestigeReward(): number {
  return Math.floor(Math.sqrt(money.value / 1000000000))//Point Per Trillion
}

function prestige() {
  const reward = calculatePrestigeReward()
  if (reward <= 0) return

  prestigePoints.value += reward
  prestigeMultiplier.value = 1 + prestigePoints.value * 0.05
  //MONEY
  money.value = 0
  localStorage.setItem("money", "0")
  //PATTERNS
  ownedPatterns.value = ["basic"]
  localStorage.setItem("ownedPatterns", JSON.stringify(ownedPatterns.value))
  Object.values(patterns).forEach(p => {
    p.owned = p.id === "basic"
  })
  //UPGRADES
  Object.values(upgrades).forEach(upgrade => {
    upgrade.lvl = 1
    upgrade.power = 1
    upgrade.value = 100
    localStorage.removeItem(`upgrade_${upgrade.id}`)
  })
  //MACHINES
  ownedMachines.value = []
  localStorage.setItem("ownedMachines", JSON.stringify([]))
  machines.forEach(m => {
    m.owned = false
  })
  //RESET
  parts.value = []
  creatingProgress.value = 0
  currentPattern.value = patterns.basic!

  localStorage.setItem("prestigePoints", prestigePoints.value.toString())
  localStorage.setItem("prestigeMultiplier", prestigeMultiplier.value.toString())

  alert(`Prestiged! You gained ${reward} prestige points.`)
}

const ownedMachineCapabilities = computed(() => {
  return {
    color: machines.some(m => m.id === "color" && m.owned),
    cut: machines.some(m => m.id === "cut" && m.owned),
    merged: machines.some(m => m.id === "merge" && m.owned)
  }
})

function canProducePattern(pattern: Pattern) {
  return Object.entries(pattern.requirements).every(
    ([req, needed]) => !needed || (ownedMachineCapabilities.value as any)[req]
  )
}

function click() {
    creatingProgress.value += upgrades.clickingPower?.power
    if (creatingProgress.value >= currentPattern.value.creationTime) {
        spawnPart()
        creatingProgress.value = 0
    }
}

function spawnPart() {
  parts.value.push({
    id: partId++,
    patternId: currentPattern.value.id,
    progress: 0,
    speed: 0.01,
    traits: {
      color: colors.gray,
      cut: "circle"
    }
  })
}

function getPositionOnPath(path: Point[], progress: number) {
  const segments = path.length - 1
  const segProgress = progress * segments
  const index = Math.floor(segProgress)
  const t = segProgress - index

  const p1 = path[index]
  const p2 = path[index + 1] ?? p1

  return {
    x: p1!.x + (p2!.x - p1!.x) * t,
    y: p1!.y + (p2!.y - p1!.y) * t
  }
}

function partStyle(part: Part) {
  const pos = getPositionOnPath(conveyorPath, part.progress)
  return {
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    fill: part.traits.color || colors.gray
  }
}

function machinePos(machine: Machine) {
  const pos = getPositionOnPath(conveyorPath, machine.at)
  return {
    transform: `translate(${pos.x}px, ${pos.y}px)`,
  }
}

function initFactoryName() {
  const stored = localStorage.getItem("factoryName")
  if (stored) {
    factoryName.value = stored
  } else {
    const name = prompt("Enter name of your factory!")
    if (name) {
      factoryName.value = name
      localStorage.setItem("factoryName", name)
    }
  }
}
function initUserName() {
  const stored = localStorage.getItem("userName")
  if (stored) {
    userName.value = stored
  } else {
    const name = prompt("Enter your username!")
    if (name) {
      userName.value = name
      localStorage.setItem("userName", name)
    }
  }
}
initFactoryName()
initUserName()

function getPatternValue(pattern: Pattern) {
  return pattern.id === dailyPattern.value.id
    ? dailyPattern.value.baseValue * upgrades.sellMultiplier.power * prestigeMultiplier.value
    : pattern.baseValue * upgrades.sellMultiplier.power * prestigeMultiplier.value
}
function displayValue(pattern: Pattern) {
  return formatNumber(Math.floor(getPatternValue(pattern) * 100) / 100)
}
function calculateValue(part: Part) {
  const pattern = patterns[part.patternId]
  return getPatternValue(pattern!)
}
function calculateExp(part: Part) {
  return patterns[part.patternId]?.baseExp
}

function setPattern(pattern: Pattern) {
  currentPattern.value = pattern
  localStorage.setItem("currentPattern", pattern.id)
}

function isPartComplete(part: Part) {
  const reqs = patterns[part.patternId]!.requirements
  return Object.entries(reqs).every(
    ([key, needed]) => !needed || (part.traits as any)[key]
  )
}

function sellPart(part: Part) {
    if (!isPartComplete(part)) {
      money.value += Math.floor(calculateValue(part) * 0.3) // scrap value
    } else {
      money.value += calculateValue(part)

      if(part.patternId === dailyPattern.value.id) {
        dc.value += 10
      }
    }
    partsSold.value += 1;
    localStorage.setItem("money", money.value.toString())
    localStorage.setItem("dc", dc.value.toString())
    localStorage.setItem("partsSold", partsSold.value.toString())
    gainExp(calculateExp(part)!)
}

const lvlPopUp = ref(false);
const gainedMoney = ref(0);

function gainExp(amount: number) {
  exp.value += amount

  if (exp.value >= expToNextLvl.value) {
    exp.value = 0
    expToNextLvl.value = Math.floor(expToNextLvl.value * 1.5)

    lvl.value++
    lvlPopUp.value = true
    gainedMoney.value = Math.pow(lvl.value, 4)
    money.value += gainedMoney.value

    setTimeout(() => {
        lvlPopUp.value = false
    }, 10000)
  }
  localStorage.setItem("exp", exp.value.toString())
  localStorage.setItem("lvl", lvl.value.toString())
  localStorage.setItem("money", money.value.toString())
  localStorage.setItem("expToNextLvl", expToNextLvl.value.toString())
}

function buyPattern(pattern: Pattern) {
  if (money.value >= pattern.price && !pattern.owned) {
    money.value -= pattern.price
    pattern.owned = true

    if (!ownedPatterns.value.includes(pattern.id)) {
      ownedPatterns.value.push(pattern.id)
    }

    localStorage.setItem("money", money.value.toString())
    localStorage.setItem(
      "ownedPatterns",
      JSON.stringify(ownedPatterns.value)
    )
  }
}

function buyMachine(machine: Machine) {
  if (money.value >= machine.price && !machine.owned) {
    money.value -= machine.price
    machine.owned = true

    if (!ownedMachines.value.includes(machine.id)) {
      ownedMachines.value.push(machine.id)
    }

    localStorage.setItem("money", money.value.toString())
    localStorage.setItem(
      "ownedMachines",
      JSON.stringify(ownedMachines.value)
    )
    location.reload()
  }
}

function buyUpgrade(upgrade: Upgrade) {
  if (money.value >= upgrade.value) {
    money.value -= upgrade.value
    upgrade.lvl++
    upgrade.power *= 1.15
    upgrade.value = Math.floor(upgrade.value * 2)

    localStorage.setItem(
      `upgrade_${upgrade.id}`,
      JSON.stringify(upgrade)
    )
    localStorage.setItem("money", money.value.toString())
  }
}

function formatNumber(value: number): string {
  value = Math.floor(value)
  if (value < 1000) return value.toString()

  const units = ["k", "M", "B", "T"]
  let unitIndex = -1
  let num = value

  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000
    unitIndex++
  }
  return `${num.toFixed(num < 10 ? 1 : 0)}${units[unitIndex]}`
}

const formattedMoney = computed(() => formatNumber(money.value))

const idleIncomePerSecond = computed(() => {
  const partsPerSecond =
    upgrades.creationSpeed.power / currentPattern.value.creationTime

  return partsPerSecond * currentPattern.value.baseValue * speedController * upgrades.sellMultiplier.power
})

const showOfflinePopup = ref(false)
const offlineReward = ref(0)

function applyOfflineProgress() {
  const lastOnline = localStorage.getItem("lastOnline")
  
  if (lastOnline) {
    const elapsedSeconds = (Date.now() - Number(lastOnline)) / 1000

    if (elapsedSeconds > 5) {
        const reward = elapsedSeconds * idleIncomePerSecond.value

        money.value += Math.floor(reward)
        localStorage.setItem("money", money.value.toString())
        offlineReward.value = Math.floor(reward)
        showOfflinePopup.value = true
        localStorage.setItem("lastOnline", Date.now().toString())
        
        console.log(
        `Offline for ${elapsedSeconds}s → earned ${reward} IGM`
        )

        setTimeout(() => {
        closeOfflinePopup()
        }, 6000)
    }
  }
}

function closeOfflinePopup() {
  showOfflinePopup.value = false
  offlineReward.value = 0
}

window.addEventListener("beforeunload", () => {
  localStorage.setItem("lastOnline", Date.now().toString())
})

let lastTime = Date.now()
const speedController = 20
const MAX_DELTA = 0.2

setInterval(() => {
  const now = Date.now()

  let deltaSeconds = (now - lastTime) / 1000
  lastTime = now

  deltaSeconds = Math.min(deltaSeconds, MAX_DELTA)

  creatingProgress.value +=
    upgrades.creationSpeed.power *
    prestigeMultiplier.value *
    deltaSeconds *
    speedController

  while (creatingProgress.value >= currentPattern.value.creationTime) {
    spawnPart()
    creatingProgress.value -= currentPattern.value.creationTime
  }

  parts.value.forEach((part, index) => {
    part.progress += part.speed * deltaSeconds * speedController

    machines.forEach(machine => {
      if (
        machine.owned &&
        part.progress >= machine.at &&
        !(part as any)[`machine_${machine.at}`]
      ) {
        Object.assign(part, machine.apply(part))
        ;(part as any)[`machine_${machine.at}`] = true
      }
    })

    if (part.progress >= 1) {
      sellPart(part)
      parts.value.splice(index, 1)
    }
  })
}, 50)

applyOfflineProgress()
</script>