import { gameStore } from '@/stores/useGameStore'
import { useSaveSystem } from "./useSaveSystem"

const { money, lvl, exp, expToNextLvl } = gameStore
const { saveGame } = useSaveSystem()

export function useGameState() {
  function gainExp(amount: number) {
    exp.value += amount
    if (exp.value >= expToNextLvl.value) {
      exp.value = 0
      lvl.value++
      expToNextLvl.value = Math.floor(expToNextLvl.value * 1.5)
      money.value += Math.pow(lvl.value, 4)

      console.log(`Leveled up to ${lvl.value}! Next level at ${expToNextLvl.value} exp.`)
      saveGame()
    }
  }

  function formatNumber(value: number): string {
    value = Math.floor(value)
    if (value < 1000) return value.toString()
    const units = ["k", "M", "B", "T"]
    let unit = -1
    let num = value
    while (num >= 1000 && unit < units.length - 1) {
      num /= 1000
      unit++
    }
    return `${num.toFixed(num < 10 ? 1 : 0)}${units[unit]}`
  }

  return { gainExp, formatNumber }
}