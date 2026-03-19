import { ref, computed } from "vue"
import type { Upgrades } from "@/types/Upgrade"
import type { Machine } from "@/types/Machine"
import { useSaveSystem } from "@/composables/useSaveSystem"

const { saveGame } = useSaveSystem()

// --- DEFAULT NAMES ---
const DEFAULT_FACTORY = "My Factory"
const DEFAULT_USER = "Player"

// --- STATE ---
export const gameStore = {
  // --- NAMES ---
  factoryName: ref(DEFAULT_FACTORY),
  userName: ref(DEFAULT_USER),

  // --- BASIC STATS ---
  money: ref(0),
  dc: ref(0),
  lvl: ref(1),
  exp: ref(0),
  expToNextLvl: ref(100),
  prestigePoints: ref(0),
  prestigeMultiplier: ref(1),

  // --- PATTERNS ---
  ownedPatterns: ref<string[]>([]),
  currentPattern: ref<any>(null),
  dailyPattern: ref<any>(null),
  dailyPatternTime: ref<number>(0),

  // --- SYSTEMS ---
  machines: ref<Machine[]>([]), // will be initialized below
  upgrades: ref<Upgrades>({} as Upgrades), // will be initialized below

  // --- META ---
  lastOnline: ref(Date.now()),

  // --- MISC ---
  partsSold: ref(0)
}

// --- HELPER: CHECK IF NAMES ARE SET ---
export const isNameSet = computed(() => {
  return (
    gameStore.factoryName.value !== DEFAULT_FACTORY &&
    gameStore.userName.value !== DEFAULT_USER
  )
})

// --- MACHINES ---
import ColorMachine from "../assets/machines/ColorMachine.png"
import CutMachine from "../assets/machines/CutMachine.png"

export function getDefaultMachines(): Machine[] {
  return [
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
            color: gameStore.currentPattern.value?.traits.color
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
            cut: gameStore.currentPattern.value?.traits.shape
          }
        }
      }
    }
  ]
}

// --- UPGRADES ---
export function getDefaultUpgrades(): Upgrades {
  return {
    clickingPower: { key: "clickingPower", id: "Clicking Power", lvl: 1, value: 50, power: 25 },
    creationSpeed: { key: "creationSpeed", id: "Creation Speed", lvl: 1, value: 100, power: 1 },
    sellMultiplier: { key: "sellMultiplier", id: "Sell Multiplier", lvl: 1, value: 100, power: 1 }
  }
}

// --- NAME SETTERS ---
export function setFactoryName(name: string) {
  gameStore.factoryName.value = name.slice(0, 15)
  saveGame()
}

export function setUserName(name: string) {
  gameStore.userName.value = name.slice(0, 15)
  saveGame()
}

// --- INITIALIZE DEFAULT MACHINES & UPGRADES ---
gameStore.machines.value = getDefaultMachines()
gameStore.upgrades.value = getDefaultUpgrades()