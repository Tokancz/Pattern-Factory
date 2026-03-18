import { ref } from "vue"
import type { Upgrades } from "@/types/Upgrade"
import type { Machine } from "@/types/Machine"

export const gameStore = {
  // --- BASIC ---
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
  machines: ref<Machine[]>(getDefaultMachines()),
  upgrades: ref<Upgrades>(getDefaultUpgrades()),

  // --- META ---
  lastOnline: ref(Date.now()),

  partsSold: ref(0)
}

export function getDefaultMachines(): Machine[] {
  return [
    {
      id: "color",
      description: "Color Machine",
      at: 0.3,
      price: 50,
      owned: false,
      src: "@assets/machines/ColorMachine.png",
      apply(part) {
        return { ...part, traits: { ...part.traits, color: gameStore.currentPattern.value?.traits.color } }
      }
    },
    {
      id: "cut",
      description: "Cutting Machine",
      at: 0.65,
      price: 25000,
      owned: false,
      src: "@assets/machines/CutMachine.png",
      apply(part) {
        return { ...part, traits: { ...part.traits, cut: gameStore.currentPattern.value?.traits.shape } }
      }
    }
  ]
}

export function getDefaultUpgrades(): Upgrades {
  return {
    clickingPower: { id: 'Clicking Power', lvl: 1, value: 50, power: 25 },
    creationSpeed: { id: 'Creation Speed', lvl: 1, value: 100, power: 1 },
    sellMultiplier: { id: 'Sell Multiplier', lvl: 1, value: 100, power: 1 }
  }
}