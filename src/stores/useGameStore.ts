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
      id: "cutter",
      description: "Cuts parts",
      at: 1,
      price: 100,
      owned: false,
      src: "cutter.png",
      apply: (part) => part
    },
    // more machines...
  ]
}

export function getDefaultUpgrades(): Upgrades {
  return {
    clickingPower: { id: 'Clicking Power', lvl: 1, value: 50, power: 25 },
    creationSpeed: { id: 'Creation Speed', lvl: 1, value: 100, power: 1 },
    sellMultiplier: { id: 'Sell Multiplier', lvl: 1, value: 100, power: 1 }
  }
}