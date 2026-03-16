import { ref, computed, type Ref } from "vue"
import type { Pattern } from "@/types/Pattern"
import type { Upgrades } from "@/types/Upgrade"

export function usePatterns(
  upgrades: Upgrades,
  prestigeMultiplier: Ref<number>,
  formatNumber: (n: number) => string,
  colors: Record<string, string>
) {
  const patterns: Record<string, Pattern> = generatePatterns()
  const ownedPatterns = ref<string[]>(JSON.parse(localStorage.getItem("ownedPatterns") || "[]"))
  const patternList = computed(() => Object.values(patterns))
  const currentPattern = ref(patterns[ownedPatterns.value[0]!] || patterns.basic)
  const dailyPattern = ref<Pattern>(getDailyPattern())
  dailyPattern.value.baseValue *= 1.5

  // ---------- Helpers ----------
  function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  function generatePatterns(): Record<string, Pattern> {
    const shapes = [
      { key: "circle", requiresCut: false, valueMul: 1 },
      { key: "circleHalf", requiresCut: true, valueMul: 3 },
      { key: "diagonal", requiresCut: true, valueMul: 5 },
      { key: "diagonalHalf", requiresCut: true, valueMul: 7 }
    ] as const

    const colorsDef = [
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
    for (const shape of shapes) {
      for (const color of colorsDef) {
        const isBasic = color.key === "gray" && shape.key === "circle"
        const id = isBasic ? "basic" : `${color.key}${capitalize(shape.key)}`
        const valueTier = Math.pow(SCALE.value, tier)
        const expTier = Math.pow(SCALE.exp, tier)
        const timeTier = Math.pow(SCALE.creationTime, tier)
        const priceTier = Math.pow(SCALE.price, tier)
        patterns[id] = {
          id,
          baseValue: Math.floor(BASE.value * valueTier * shape.valueMul),
          baseExp: Math.floor(BASE.exp * expTier),
          creationTime: Math.floor(BASE.creationTime * timeTier),
          price: isBasic ? 0 : Math.floor(priceTier * 100),
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

  const DAILY_INTERVAL = 30 * 60 * 1000
  
  function getEligiblePatterns(): Pattern[] {
    return Object.values(patterns).filter(p => p.id !== "basic")
  }

  function getDailyPattern(): Pattern {
    const now = Date.now()
    const saved = localStorage.getItem("dailyPattern")
    const savedTime = Number(localStorage.getItem("dailyPatternTime"))
    if (saved && savedTime && now - savedTime < DAILY_INTERVAL && patterns[saved]) {
      return structuredClone(patterns[saved])
    }
    const pool = getEligiblePatterns()
    if (pool.length === 0) return structuredClone(patterns.basic)!
    const random = pool[Math.floor(Math.random() * pool.length)]
    localStorage.setItem("dailyPattern", random!.id)
    localStorage.setItem("dailyPatternTime", now.toString())
    return structuredClone(random)!
  }

  // ---------- API ----------
  function setPattern(pattern: Pattern) {
    currentPattern.value = pattern
    localStorage.setItem("currentPattern", pattern.id)
  }

  function buyPattern(pattern: Pattern, moneyRef: Ref<number>) {
    if (moneyRef.value >= pattern.price && !pattern.owned) {
      moneyRef.value -= pattern.price
      pattern.owned = true
      if (!ownedPatterns.value.includes(pattern.id)) ownedPatterns.value.push(pattern.id)
      localStorage.setItem("ownedPatterns", JSON.stringify(ownedPatterns.value))
      localStorage.setItem("money", moneyRef.value.toString())
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

  return { patterns, patternList, ownedPatterns, currentPattern, setPattern, buyPattern, dailyPattern, displayValue, getPatternValue }
}