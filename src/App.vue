<template>
    <header>
        <div id="header_info">
            <img src="/img/Header.png" alt="Header" draggable="false">
            <h1>{{ factoryName }}</h1>
            <div>
                <p id="user">{{ userName }}</p>
                <p>Level: {{ lvl }}</p>
                <p>EXP: {{ exp }}/ {{ expToNextLvl }}</p>
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
                <p>Part Price: {{ getPatternValue(currentPattern) }} IGM</p>
            </section>
            <section>
                <h3>Daily Pattern</h3>
                <p>1.5x mutliplier !!</p>
                <p>Price: {{ getPatternValue(dailyPattern) }} IGM</p>
                <svg viewBox="0 0 32 32" draggable="false" :style="{fill: colors[dailyPattern.id]}">
                    <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
                    <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
                    <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
                </svg>
            </section>
        </aside>
        <section id="simulation">
            <div @click="click" id="factory">
                <img src="/img/Factory.png" alt="Factory" draggable="false">
                <svg viewBox="0 0 32 32" :style="{fill: colors[currentPattern.id]}">
                    <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
                    <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
                    <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
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
                :style="partStyle(part)">

                <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
                <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
                <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
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
                <div class="pattern" v-for="pattern in patterns" :key="pattern.id">
                    <svg viewBox="0 0 32 32" :style="{fill: colors[pattern.id]}">
                        <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
                        <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
                        <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
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
                    <svg viewBox="0 0 32 32" :style="{fill: colors[pattern.id]}">
                        <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
                        <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
                        <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
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
  creationTime: number
  price: number
  owned: boolean

  requirements: {
    color?: boolean
    cut?: boolean
    merged?: boolean
  }

  src?: string
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

//STATE
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

const savedFactoryName = localStorage.getItem("factoryName")

const conveyorPath: Point[] = [
    { x: 0, y: 120 },
    { x: 0, y: 500 },
]

const colors: Record<string, string> = {
    basic: "#cdcdcd",
    redCircle: "#ff4d4d",
    blueCircle: "#85a7ff",
    greenCircle: "#4ddf88",
    yellowCircle: "#ffd972",
    purpleCircle: "#9858ed"
}

const upgrades: Record<string, Upgrade> = {//Use Clicking Power.power as prev clicking power
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
    }
}

Object.values(upgrades).forEach(upgrade => {
  const saved = localStorage.getItem(`upgrade_${upgrade.id}`)
  if (saved) {
    Object.assign(upgrade, JSON.parse(saved))
  }
})

const patterns: Record<string, Pattern> = {
  basic: {
    id: "basic",
    baseValue: 1,
    baseExp: 2,
    creationTime: 100,
    price: 0,
    owned: true,
    requirements: {}
  },
  redCircle: {
    id: "redCircle",
    baseValue: 5,
    baseExp: 3,
    creationTime: 150,
    price: 100,
    owned: false,
    requirements: { color: true }
  },
  blueCircle: {
    id: "blueCircle",
    baseValue: 10,
    baseExp: 8,
    creationTime: 200,
    price: 500,
    owned: false,
    requirements: { color: true }
  },
  greenCircle: {
    id: "greenCircle",
    baseValue: 25,
    baseExp: 15,
    creationTime: 300,
    price: 5000,
    owned: false,
    requirements: { color: true }
  },
  yellowCircle: {
    id: "yellowCircle",
    baseValue: 100,
    baseExp: 80,
    creationTime: 500,
    price: 12500,
    owned: false,
    requirements: { color: true }
  },
  purpleCircle: {
    id: "purpleCircle",
    baseValue: 300,
    baseExp: 250,
    creationTime: 1000,
    price: 25000,
    owned: false,
    requirements: { color: true }
  }
}

const machines: Machine[] = [
  {
    id: "color",
    description: "Color Machine",
    at: 0.4,
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
    at: 0.7,
    price: 10000,
    owned: false,
    src: "/img/CutMachine.png",
    apply(part) {
      return {
        ...part,
        traits: {
          ...part.traits,
          cut: true
        }
      }
    }
  }
]

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
    traits: {} // born blank
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
    ? dailyPattern.value.baseValue
    : pattern.baseValue
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

//SELL & LEVEL
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
    const lastSeen = localStorage.getItem("lastSeen")

    if (lastSeen) {
        const elapsedSeconds = (Date.now() - Number(lastSeen)) / 1000
        const reward = elapsedSeconds * idleIncomePerSecond.value

        money.value += Math.floor(reward)
        localStorage.setItem("money", money.value.toString())
        
        console.log(
            `Offline for ${elapsedSeconds}s → earned ${reward} IGM`
        )

        setTimeout(() => {
            showOfflinePopup.value = false
        }, 6000)
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
let speedController = 20

setInterval(() => {
  const now = Date.now()
  const deltaSeconds = (now - lastTime) / 1000
  lastTime = now

  // progress creation
  creatingProgress.value += upgrades.creationSpeed.power * deltaSeconds * speedController

  if (creatingProgress.value >= currentPattern.value.creationTime) {
    spawnPart()
    creatingProgress.value -= currentPattern.value.creationTime
  }

  // move parts
  parts.value.forEach((part, index) => {
    part.progress += part.speed * deltaSeconds * speedController

    machines.forEach(machine => {
    if (
        machine.owned &&
        part.progress >= machine.at &&
        !(part as any)[`machine_${machine.id}`]
    ) {
        Object.assign(part, machine.apply(part))
        ;(part as any)[`machine_${machine.id}`] = true
    }
    })


    if (part.progress >= 1) {
      sellPart(part)
      parts.value.splice(index, 1)
    }
  })
}, 50)

applyOfflineProgress()

//Todo: Level Up rewards
</script>