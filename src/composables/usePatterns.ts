import { computed } from "vue"
import type { Pattern } from "@/types/Pattern"
import { useSaveSystem } from "./useSaveSystem"
import { gameStore, getDefaultUpgrades, getDefaultMachines } from '@/stores/useGameStore'
import { useGameState } from "@/composables/useGameState"


export function usePatterns(
  colors: Record<string, string>
) {
  const { saveGame, loadGame } = useSaveSystem()
  const { formatNumber } = useGameState()
  const { ownedPatterns, dailyPattern, dailyPatternTime, currentPattern, machines, upgrades, money, prestigeMultiplier} = gameStore

  // ---------- PATTERNS ----------
  const patterns: Record<string, Pattern> = generatePatterns()

  // 1. load save
  loadGame(patterns)

  // 2. fix missing values
  if (!currentPattern.value) {
    currentPattern.value = structuredClone(patterns.basic)
  }

  if (!dailyPattern.value) {
    dailyPattern.value = getDailyPattern()
  }

  if (!upgrades.value || !upgrades.value.clickingPower) {
    upgrades.value = getDefaultUpgrades()
  }

  if (!machines.value.length) {
    machines.value = getDefaultMachines()
  }

  // 3. save once
  saveGame()

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
          requirements: {
            ...(color.requiresColor ? { color: true } : {}),
            ...(shape.requiresCut ? { cut: true } : {})
          },
          traits: { color: colors[color.key]!, shape: shape.key }
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

  // ---------- DAILY PATTERN ----------
  function getDailyPattern(): Pattern {
    const now = Date.now()
    const savedId = dailyPattern.value?.id
    const savedTime = dailyPatternTime.value

    if (
      savedId &&
      savedTime &&
      now - savedTime < DAILY_INTERVAL &&
      patterns[savedId]
    ) {
      return structuredClone(patterns[savedId]!)
    }

    const pool = getEligiblePatterns()
    let random: Pattern
    if (pool.length > 0) {
      random = pool[Math.floor(Math.random() * pool.length)]!
    } else {
      random = patterns.basic!
    }

    dailyPattern.value = structuredClone(random)
    dailyPatternTime.value = now
    saveGame()

    return structuredClone(random)
  }

  // ---------- API ----------
  function setPattern(pattern: Pattern) {
    currentPattern.value = pattern
    saveGame()
  }

  function buyPattern(pattern: Pattern) {
    if (money.value >= pattern.price && !ownedPatterns.value.includes(pattern.id)) {
      money.value -= pattern.price
      ownedPatterns.value.push(pattern.id)
      saveGame()
    }
  }

  function getPatternValue(pattern: Pattern) {
    const daily = dailyPattern.value

    const base =
      daily && pattern.id === daily.id
        ? pattern.baseValue * 1.5
        : pattern.baseValue

    return base * upgrades.value.sellMultiplier.power * prestigeMultiplier.value
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
    getDailyPattern,
    shapes,
    generatePatterns
  }
}