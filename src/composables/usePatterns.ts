import { ref, computed, type Ref } from "vue"
import type { Pattern } from "@/types/Pattern"
import type { Upgrades } from "@/types/Upgrade"
import { useSaveSystem } from "./useSaveSystem"
import { gameStore } from '@/stores/useGameStore'

export function usePatterns(
  prestigeMultiplier: Ref<number>,
  formatNumber: (n: number) => string,
  colors: Record<string, string>
) {
  const { saveGame, loadGame } = useSaveSystem()
  const { ownedPatterns, dailyPattern, dailyPatternTime, currentPattern, machines, upgrades} = gameStore

  // ---------- PATTERNS ----------
  const patterns: Record<string, Pattern> = generatePatterns()
  const patternList = computed(() => Object.values(patterns))

  // ---------- SHAPES ----------
  const shapes: Record<string, string> = {
    circle: `<g transform="matrix(0.96875,0,0,0.96875,0.5,0.5)"><circle cx="16" cy="16" r="16"/></g><g><path d="M16,0C16.025,2.675 16,32 16,32"/></g><g transform="matrix(0.96875,0,0,1,0.5,0)"><path d="M32,16L0,16"/></g>`,
    circleHalf: `<g transform="matrix(0.969044,0,0,0.937337,1.002611,1.065274)"><path d="M15.52,0L15.52,32C6.954,32 0,24.831 0,16C0,7.169 6.954,0 15.52,0Z"/></g><path d="M1.003,16L16,16.063"/>`,
    diagonal: `<g transform="matrix(0.466943,0.466943,-0.466943,0.466943,16.057836,1.057122)"><rect x="1.003" y="1.065" width="29.872" height="29.995"/></g><g transform="matrix(1.818334,0.003438,0.003438,1.000014,0.48632,-0.003679)"><path d="M1.003,16L16,16.063"/></g><g transform="matrix(-0.004201,-1.818333,0.999991,-0.007639,0.004355,31.581012)"><path d="M1.003,16L16,16.063"/></g>`,
    diagonalHalf: `<path d="M16.029,2.023L16,29.977L2.023,16L16.029,2.023Z"/><g transform="matrix(0.909176,-0.000382,-0.000382,0.999998,1.459314,0.000408)"><path d="M1.003,16L16,16.063"/></g>`
  }

  // ---------- GENERATE PATTERNS ----------
  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  function generatePatterns(): Record<string, Pattern> {
    const shapeDefs = [
      { key: "circle", requiresCut: false, valueMul: 1 },
      { key: "circleHalf", requiresCut: true, valueMul: 3 },
      { key: "diagonal", requiresCut: true, valueMul: 5 },
      { key: "diagonalHalf", requiresCut: true, valueMul: 7 }
    ] as const

    const colorsDefs = [
      { key: "gray", requiresColor: false },
      { key: "red", requiresColor: true },
      { key: "blue", requiresColor: true },
      { key: "green", requiresColor: true },
      { key: "yellow", requiresColor: true },
      { key: "purple", requiresColor: true },
      { key: "cyan", requiresColor: true }
    ] as const

    const BASE = { value: 2, exp: 2, creationTime: 100, price: 0 }
    const SCALE = { value: 2.5, exp: 2, creationTime: 1.5, price: 3.5 }

    const patterns: Record<string, Pattern> = {}
    let tier = 0
    for (const shape of shapeDefs) {
      for (const color of colorsDefs) {
        const isBasic = color.key === "gray" && shape.key === "circle"
        const id = isBasic ? "basic" : `${color.key}${capitalize(shape.key)}`
        patterns[id] = {
          id,
          baseValue: Math.floor(BASE.value * Math.pow(SCALE.value, tier) * shape.valueMul),
          baseExp: Math.floor(BASE.exp * Math.pow(SCALE.exp, tier)),
          creationTime: Math.floor(BASE.creationTime * Math.pow(SCALE.creationTime, tier)),
          price: isBasic ? 0 : Math.floor(Math.pow(SCALE.price, tier) * 100),
          owned: isBasic,
          requirements: {
            ...(color.requiresColor ? { color: true } : {}),
            ...(shape.requiresCut ? { cut: true } : {})
          },
          traits: { color: colors[color.key], shape: shape.key }
        }
        tier++
      }
    }
    return patterns
  }

  // ---------- DAILY PATTERN ----------
  const DAILY_INTERVAL = 30 * 60 * 1000

  function getEligiblePatterns(): Pattern[] {
    return Object.values(patterns).filter(p => p.id !== "basic")
  }

  function getDailyPattern(): Pattern {
    const now = Date.now()
    const savedId = dailyPattern.value?.id
    const savedTime = dailyPatternTime.value

    if (savedId && savedTime && now - savedTime < DAILY_INTERVAL && patterns[savedId]) {
      return structuredClone(patterns[savedId])
    }

    const pool = getEligiblePatterns()
    const random = pool.length ? pool[Math.floor(Math.random() * pool.length)] : patterns.basic
    dailyPattern.value = structuredClone(random)
    dailyPatternTime.value = now
    saveGame()
    return structuredClone(random)
  }

  if (!dailyPattern.value) getDailyPattern()
  dailyPattern.value.baseValue *= 1.5

  // ---------- LOAD GAME ----------
  loadGame(patterns)

  // ---------- DEFAULT UPGRADES ----------
  if (!Object.keys(upgrades.value).length) {
    upgrades.value = {
      clickingPower: { id: 'Clicking Power', lvl: 1, value: 50, power: 25 },
      creationSpeed: { id: 'Creation Speed', lvl: 1, value: 100, power: 1 },
      sellMultiplier: { id: 'Sell Multiplier', lvl: 1, value: 100, power: 1 }
    }
    saveGame()
  }

  // ---------- DEFAULT MACHINES ----------
  if (!machines.value.length) {
    machines.value = []
    saveGame()
  }

  // ---------- API ----------
  function setPattern(pattern: Pattern) {
    currentPattern.value = pattern
    saveGame()
  }

  function buyPattern(pattern: Pattern, moneyRef: Ref<number>) {
    if (moneyRef.value >= pattern.price && !pattern.owned) {
      moneyRef.value -= pattern.price
      pattern.owned = true
      if (!ownedPatterns.value.includes(pattern.id)) ownedPatterns.value.push(pattern.id)
      saveGame()
    }
  }

  function getPatternValue(pattern: Pattern) {
    return pattern.id === dailyPattern.value.id
      ? dailyPattern.value.baseValue * upgrades.sellMultiplier.power * prestigeMultiplier.value
      : pattern.baseValue * upgrades.sellMultiplier.power * prestigeMultiplier.value
  }

  function displayValue(pattern: Pattern) {
    return formatNumber(Math.floor(getPatternValue(pattern) * 100) / 100)
  }

  return {
    patterns,
    patternList,
    ownedPatterns,
    currentPattern,
    setPattern,
    buyPattern,
    dailyPattern,
    displayValue,
    getPatternValue,
    shapes
  }
}