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
                <svg viewBox="0 0 32 32" draggable="false" 
                  :style="{fill: colors[dailyPattern.id]}"
                  v-html="shapes[dailyPattern.shape]">
                </svg>
            </section>
        </aside>
        <section id="simulation">
            <div @click="click" id="factory">
                <img src="/img/Factory.png" alt="Factory" draggable="false">
                <svg viewBox="0 0 32 32" 
                  :style="{fill: colors[currentPattern.id]}" 
                  v-html="shapes[currentPattern.shape]">
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
                    <button class="button">Prestige</button>
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
                <div class="pattern" v-for="pattern in patterns" :key="pattern.id" v-show="canProducePattern(pattern)">
                    <svg viewBox="0 0 32 32" 
                      :style="{fill: colors[pattern.id]}"
                      v-html="shapes[pattern.shape]">
                    </svg>
                    <button v-if="!pattern.owned" @click="buyPattern(pattern)">Price: {{ formatNumber(pattern.price) }} IGM</button>
                    <button v-else>Owned</button>
                </div>
            </div>
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
                    <p>Cost: {{ upgrade.value }}</p>
                    <button class="buy_button" @click="buyUpgrade(upgrade)">Buy</button>
                </div>
            </div>
        </section>
        <section class="tab" v-if="openedShop === 'inventory'">
            <div class="shop_header">
                <h4>Inventory</h4>
                <p @click="openedShop = ''">X</p>
            </div>
            <div class="container">
                <div class="pattern" v-for="pattern in patternList" :key="pattern.id" :disabled="!canProducePattern(pattern)" v-show="pattern.owned" @click="setPattern(pattern)">
                    <svg viewBox="0 0 32 32" 
                      :style="{fill: colors[pattern.id]}"
                      v-html="shapes[pattern.shape]">
                    </svg>
                    <p>Price: {{ pattern.baseValue }}</p>
                    <p>Exp: {{ pattern.baseExp }}</p>
                    <p>Creation time: {{ pattern.creationTime }}</p>
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
        <p>Money: {{ formattedMoney }} IGM</p>
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
  shape: string
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

const openedShop = ref("")
const money = ref(localStorage.getItem("money") ? parseInt(localStorage.getItem("money")!) : 0)
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

const colors: Record<string, string> = {//Optimize for 1 color per color variation
  basic: "#cdcdcd",
  redCircle: "#ff4d4d",
  blueCircle: "#85a7ff",
  greenCircle: "#4ddf88",
  yellowCircle: "#ffd972",
  purpleCircle: "#9858ed",
  basicHalf: "#cdcdcd",
  redHalf: "#ff4d4d",
  blueHalf: "#85a7ff"
}

const shapes: Record<string, string> = {
  circle: `
    <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
    <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
    <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
  `,
  circleHalf: `
    <g>
      <g transform="matrix(0.969044,0,0,0.937337,1.002611,1.065274)">
      <path d="M15.52,0L15.52,32C6.954,32 0,24.831 0,16C0,7.169 6.954,0 15.52,0Z"/>
      </g>
      <path d="M1.003,16L16,16.063"/>
    </g>
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
    id: "sellMutliplier",
    lvl: 1,
    value: 100,
    power: 1
  }
}

const patterns: Record<string, Pattern> = {
  basic: {
    id: "basic",
    shape: "circle",
    baseValue: 2,
    baseExp: 2,
    creationTime: 100,
    price: 0,
    owned: true,
    requirements: {}
  },
  redCircle: {
    id: "redCircle",
    shape: "circle",
    baseValue: 5,
    baseExp: 3,
    creationTime: 150,
    price: 100,
    owned: false,
    requirements: { color: true }
  },
  blueCircle: {
    id: "blueCircle",
    shape: "circle",
    baseValue: 15,
    baseExp: 8,
    creationTime: 200,
    price: 500,
    owned: false,
    requirements: { color: true }
  },
  greenCircle: {
    id: "greenCircle",
    shape: "circle",
    baseValue: 50,
    baseExp: 15,
    creationTime: 300,
    price: 5000,
    owned: false,
    requirements: { color: true }
  },
  yellowCircle: {
    id: "yellowCircle",
    shape: "circle",
    baseValue: 100,
    baseExp: 80,
    creationTime: 500,
    price: 12500,
    owned: false,
    requirements: { color: true }
  },
  purpleCircle: {
    id: "purpleCircle",
    shape: "circle",
    baseValue: 300,
    baseExp: 250,
    creationTime: 1000,
    price: 25000,
    owned: false,
    requirements: { color: true }
  },
  basicHalf: {
    id: "basicHalf",
    shape: "circleHalf",
    baseValue: 1000,
    baseExp: 750,
    creationTime: 2000,
    price: 40000,
    owned: false,
    requirements: { cut: true }
  },
  redHalf: {
    id: "redHalf",
    shape: "circleHalf",
    baseValue: 2500,
    baseExp: 2000,
    creationTime: 5000,
    price: 100000,
    owned: false,
    requirements: { color: true, cut: true }
  },
  blueHalf: {
    id: "blueHalf",
    shape: "circleHalf",
    baseValue: 7500,
    baseExp: 5000,
    creationTime: 10000,
    price: 250000,
    owned: false,
    requirements: { color: true, cut: true }
  }
}

const machines: Machine[] = [
  {
    id: "color",
    description: "Color Machine",
    at: 0.3,
    price: 50,
    owned: false,
    src: "/img/ColorMachine.png",
    apply(part) {
      return {
        ...part,
        traits: {
          ...part.traits,
          color: colors[part.patternId]
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
    src: "/img/CutMachine.png",
    apply(part) {
      return {
        ...part,
        traits: {
          ...part.traits,
          cut: patterns[part.patternId]?.shape
        }
      }
    }
  }
]

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

const machineList = computed(() => Object.values(machines))
Object.values(machines).forEach(machine => {
  machine.owned =
    machine.owned || ownedMachines.value.includes(machine.id)
})

const storeCurrentPattern = localStorage.getItem("currentPattern")
const currentPattern = ref<Pattern>(
    storeCurrentPattern && patterns[storeCurrentPattern]
    ? patterns[storeCurrentPattern] : patterns.basic
)

const dailyPattern = ref<Pattern>({ ...patterns.blueCircle });
dailyPattern.value.baseValue *= 1.5; // 50% price increase for daily pattern

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
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t
  }
}

function partStyle(part: Part) {
  const pos = getPositionOnPath(conveyorPath, part.progress)
  return {
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    fill: part.traits.color || colors.basic
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
    ? dailyPattern.value.baseValue * upgrades.sellMultiplier.power
    : pattern.baseValue * upgrades.sellMultiplier.power
}
function displayValue(pattern: Pattern) {
  return formatNumber(Math.floor(getPatternValue(pattern) * 100) / 100)
}
function calculateValue(part: Part) {
  const pattern = patterns[part.patternId]
  return getPatternValue(pattern)
}
function calculateExp(part: Part) {
  return patterns[part.patternId]?.baseExp
}

function setPattern(pattern: Pattern) {
  currentPattern.value = pattern
  localStorage.setItem("currentPattern", pattern.id)
}

function isPartComplete(part: Part) {
  const reqs = patterns[part.patternId].requirements
  return Object.entries(reqs).every(
    ([key, needed]) => !needed || (part.traits as any)[key]
  )
}

function sellPart(part: Part) {
    if (!isPartComplete(part)) {
        money.value += Math.floor(calculateValue(part) * 0.3) // scrap value
    } else {
        money.value += calculateValue(part)
    }
    partsSold.value += 1;
    localStorage.setItem("money", money.value.toString())
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
    gainedMoney.value = lvl.value * 20
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
    upgrade.power *= 1.2
    upgrade.value = Math.floor(upgrade.value * 2)

    localStorage.setItem(
      `upgrade_${upgrade.id}`,
      JSON.stringify(upgrade)
    )
    localStorage.setItem("money", money.value.toString())
  }
}

function formatNumber(value: number): string {
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

  return partsPerSecond * currentPattern.value.baseValue * speedController
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
    upgrades.creationSpeed.power * deltaSeconds * speedController

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