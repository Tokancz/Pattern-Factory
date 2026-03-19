import { gameStore } from '@/stores/useGameStore'
import { useSaveSystem } from "@/composables/useSaveSystem"

const { saveGame, prestigeReset } = useSaveSystem()
const { money, prestigePoints } = gameStore

export function usePrestige(
  patterns: any,
  ownedMachines: any,
  parts: any,
  creatingProgress: any,
) {

  function calculatePrestigeReward() {
    return Math.floor(Math.sqrt(money.value / 1_000_000_000))
  }

  function prestige() {
    const reward = calculatePrestigeReward()
    if (reward <= 0) return

    prestigePoints.value += reward

    prestigeReset(patterns)

    ownedMachines.value = []

    parts.value = []
    creatingProgress.value = 0

    saveGame()

    alert(`Prestiged! You gained ${reward} prestige points.`)
  }

  return { prestigePoints, calculatePrestigeReward, prestige}
}