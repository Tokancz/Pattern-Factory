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
        </div>
    </header>
    <main>
        <aside id="stats">
            <section>
                <h3>Stats</h3>
                <p>Income: 0 IGM/s</p>
                <p>Idle: 0 IGM/h</p>
                <p>Parts Sold: {{ partsSold }}</p>
            </section>
            <section>
                <h3>Progress</h3>
                <p>Next Part: {{ Math.floor(creatingProgress / currentPattern.creationTime * 100) }} %</p>
                <input type="range" min="0" :max="currentPattern.creationTime" class="slider" v-model="creatingProgress" disabled="true">
                <p>Part Price: {{ currentPattern.baseValue }} IGM</p>
            </section>
            <section>
                <h3>Daily Pattern</h3>
                <p>Price: {{ dailyPattern.baseValue }} IGM</p> <!-- NEEDS FIX -->
                <svg viewBox="0 0 32 32" draggable="false" :style="{fill: dailyPattern.traits.color}">
                    <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
                    <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
                    <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
                </svg>
            </section>
        </aside>
        <section id="simulation">
            <div @click="click" id="factory">
                <img src="/img/Factory.png" alt="Factory" draggable="false">
                <svg viewBox="0 0 32 32" draggable="false" :style="{fill: currentPattern.traits.color}">
                    <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
                    <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
                    <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
                </svg>
                <p id="progress">Progress {{ Math.floor(creatingProgress / currentPattern.creationTime * 100) }} %</p>
            </div>
            <div id="belt"></div>
            <img src="/img/ColorMachine.png" alt="color machine" id="color_machine">
            <img src="/img/Seller.png" alt="Seller" id="seller" draggable="false">
            <svg viewBox="0 0 32 32"
                v-for="part in parts"
                :key="part.id"
                class="part"
                :style="partStyle(part)"
                draggable="false">

                <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
                <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
                <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
            </svg>
            <!-- PARTS -->
        </section>
        <section id="shopList">
            <img src="/img/Shop.png" alt="shopBG" draggable="false">
            <aside>
                <div class="shop_header">
                    <h2>SHOP</h2>
                    <img src="/img/ShoppingCart.png" alt="Shop Icon" draggable="false">
                </div>
                <div class="shop_buttons">
                    <button class="button" @click="patternShop = !patternShop">Patterns</button>
                    <button class="button">Tools</button>
                    <button class="button" @click="upgradesShop = !upgradesShop">Upgrades</button>
                    <button class="button">Prestige</button>
                </div>
                <button class="button" @click="inventory = !inventory">Inventory</button>
            </aside>
        </section>
        <section class="shop" v-if="patternShop">
            <div class="shop_header">
                <h4>Pattern Shop</h4>
                <p @click="patternShop = !patternShop">X</p>
            </div>
            <div class="container">
                <div class="pattern" v-for="pattern in patterns" :key="pattern.id">
                    <svg viewBox="0 0 32 32" draggable="false" :style="{fill: pattern.traits.color}">
                        <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
                        <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
                        <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
                    </svg>
                    <button v-if="!pattern.owned" @click="buyPattern(pattern)">Price: {{ pattern.price }}</button>
                    <button v-else>Owned</button>
                </div>
            </div>
        </section>
        <section class="shop" v-if="upgradesShop">
            <div class="shop_header">
                <h4>Upgrade</h4>
                <p @click="upgradesShop = !upgradesShop">X</p>
            </div>
            <div class="container">
                <div class="upgrade" v-for="upgrade in upgrades">
                    <p>{{ upgrade.id + " lvl: " + upgrade.lvl}}</p>
                    <p>Cost: {{ upgrade.value }}</p>
                    <button class="buy_button" @click="buyUpgrade(upgrade)">Buy</button>
                </div>
            </div>
        </section>
        <section class="shop" v-if="inventory">
            <div class="shop_header">
                <h4>Inventory</h4>
                <p @click="inventory = !inventory">X</p>
            </div>
            <div class="container">
                <div class="pattern" v-for="pattern in patterns" :key="pattern.id" v-show="pattern.owned">
                    <svg viewBox="0 0 32 32" draggable="false" :style="{fill: pattern.traits.color}">
                        <g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g>
                        <g><path d="M16,0C16.025,2.675 16,32 16,32"/></g>
                        <g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>
                    </svg>
                    <button v-if="currentPattern.id !== pattern.id"  @click="setPattern(pattern)">Select</button>
                    <button v-if="currentPattern.id == pattern.id">Selected</button>
                </div>
            </div>
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
    creationTime: number
    price: number
    owned: boolean
    traits: {
        color?: string
        cut?: boolean
        merged?: boolean
    }
    src?: string
}

type Machine = {
    at: number // progress position (0–1)
    apply(part: Part): Part
    owned: boolean
    src: string
}

type Upgrade = {
    id: string
    lvl: number
    value: number
    power: number
}

//STATE
const factoryName = ref("Pattern Factory")
const userName = ref("Player")

const patternShop = ref(false);
const upgradesShop = ref(false);
const inventory = ref(false);

const money = ref(localStorage.getItem("money") ? parseInt(localStorage.getItem("money")!) : 0)
const lvl = ref(localStorage.getItem("lvl") ? parseInt(localStorage.getItem("lvl")!) : 1)
const exp = ref(localStorage.getItem("exp") ? parseInt(localStorage.getItem("exp")!) : 0)
const expToNextLvl = ref(localStorage.getItem("expToNextLvl") ? parseInt(localStorage.getItem("expToNextLvl")!) : 100)

const parts = ref<Part[]>([])
let partId = 0

const creatingProgress = ref<number>(0);

const partsSold = ref(localStorage.getItem("partsSold") ? parseInt(localStorage.getItem("partsSold")!) : 0);

//CONVEYOR PATH (ANY SHAPE)
const conveyorPath: Point[] = [
    { x: 0, y: 120 },
    { x: 0, y: 500 },
]

const colors: {} = {
    basic: "#cdcdcd",
    redCircle: "#ff4d4d",
    blueCircle: "#bbceff",
    greenCircle: "#4ddf88"
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

//PATTERNS (BLUEPRINTS) LIST OF ALL PATTERN TYPES
const patterns: Record<string, Pattern> = {
    basic: {
        id: "basic",
        baseValue: 1,
        baseExp: 2,
        creationTime: 100,
        price: 0,
        owned: true,
        traits: {
            color: colors.basic,
            cut: false,
            merged: false
        }
    },
    redCircle: {
        id: "redCircle",
        baseValue: 5,
        baseExp: 3,
        creationTime: 120,
        price: 100,
        owned: localStorage.getItem("redCircle_owned") ? true : false,
        traits: {
            color: colors.redCircle,
            cut: false,
            merged: false
        }
    },
    blueCircle: {
        id: "blueCircle",
        baseValue: 10,
        baseExp: 8,
        creationTime: 150,
        price: 500,
        owned: localStorage.getItem("blueCircle_owned") ? true : false,
        traits: {
            color: colors.blueCircle,
            cut: false,
            merged: false
        }
    },
    greenCircle: {
        id: "greenCircle",
        baseValue: 25,
        baseExp: 15,
        creationTime: 200,
        price: 5000,
        owned: localStorage.getItem("greenCircle_owned") ? true : false,
        traits: {
            color: colors.greenCircle,
            cut: false,
            merged: false
        }
    }

}

let storagePattern = localStorage.getItem("currentPattern") //fix Later
const currentPattern = ref<Pattern>(patterns.storagePattern ? false : patterns.basic);
console.log(currentPattern.value.id)
const dailyPattern = ref<Pattern>(patterns.greenCircle);
dailyPattern.value.baseValue *= 1.5; // 50% price increase for daily pattern


//MACHINES
const machines: Machine[] = [
  {
    at: 0.4, //COLOR MACHINE
    apply(part) {
      return {
        ...part,
        traits: { ...part.traits, color: currentPattern.value.traits.color }
      }
    },
    owned: true,
    src:"/img/ColorMachine.png"
  },
  {
    at: 0.7, //CUTTING MACHINE
    apply(part) {
      return {
        ...part,
        traits: { ...part.traits, cut: currentPattern.value.traits.cut }
      }
    },
    owned: false,
    src:"/img/ColorMachine.png"//change sprite
  }
]

function spawnPart() {
  parts.value.push({
    id: partId++,
    patternId: "basic",
    progress: 0,
    speed: 0.01,
    traits: {
        color: patterns.basic.traits.color,
        cut: patterns.basic.traits.cut,
        merged: patterns.basic.traits.merged
    }
  })
}
function click() {
    creatingProgress.value += upgrades.clickingPower?.power
    if (creatingProgress.value >= currentPattern.value.creationTime) {
        spawnPart()
        creatingProgress.value = 0
    }
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
    transform: `translate(${pos.x}px, ${pos.y}px)`,
    fill: part.traits.color || colors.basic
  }
}

//VALUE CALCULATION AND EXP CALCULATION -- REMOVE SCHIZO LOGS
function calculateValue(part: Part) {
  let value = currentPattern.value.baseValue
  if (currentPattern.value.id === dailyPattern.value.id) {
    value = dailyPattern.value.baseValue
    console.log("Daily !!")
  }
  console.log("Calculated Value:", value);
  return value
}
function calculateExp(part: Part) {
  return currentPattern.value.baseExp
}

//SELL & LEVEL
function sellPart(part: Part) {
    money.value += calculateValue(part)
    partsSold.value += 1;
    localStorage.setItem("money", money.value.toString())
    localStorage.setItem("partsSold", partsSold.value.toString())
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

function buyPattern(pattern: Pattern) {
    if (money.value >= pattern.price && !pattern.owned) {
        money.value -= pattern.price;
        pattern.owned = true;
        localStorage.setItem("money", money.value.toString());
        localStorage.setItem(`${pattern.id}_owned`, "true");
    }
}
function buyUpgrade(upgrade: Upgrade){
    if (money.value >= upgrade.value) {
        money.value -= upgrade.value
        upgrade.lvl ++
        upgrade.power *= 1.2
        upgrade.value *= 2
    }
}

function calculateIdle() {
    let timer = Date.now()
}
function setPattern(pattern: Pattern) {
    currentPattern.value = pattern
    localStorage.setItem("currentPattern", pattern.id)
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
    creatingProgress.value += upgrades.creationSpeed?.power;
    if (creatingProgress.value >= currentPattern.value.creationTime) {
        spawnPart()
        creatingProgress.value = 0
    }
    /*
    document.addEventListener('mousemove', (event) => {
        console.log(`Mouse X: ${event.clientX}, Mouse Y: ${event.clientY}`);
    });*/
}, 50)
</script>