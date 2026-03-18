import { ref } from "vue"
import type { Upgrade, Upgrades } from "@/types/Upgrade"
import type { Machine } from "@/types/Machine"

export const gameStore = {
  // --- BASIC ---
  money: ref(0),
  dc: ref(0),
  lvl: ref(1),
  exp: ref(0),
  expToNextLvl: ref(100),
  prestigeMultiplier: ref(1),

  // --- PATTERNS ---
  ownedPatterns: ref<string[]>([]),
  currentPattern: ref<any>(null),
  dailyPattern: ref<any>(null),
  dailyPatternTime: ref<number>(0),

  // --- SYSTEMS ---
  machines: ref<Machine[]>([]),
  upgrades: ref<Upgrades>({}),

  // --- META ---
  lastOnline: ref(Date.now()),

  partsSold: ref(0)
}