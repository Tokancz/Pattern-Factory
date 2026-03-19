import { ref, computed } from "vue"
import { gameStore } from '@/stores/useGameStore'
import { useSaveSystem } from "./useSaveSystem"

const { money, upgrades, currentPattern } = gameStore
const { saveGame } = useSaveSystem()

export function useOffline() {
  const showOfflinePopup = ref(false)
  const offlineReward = ref(0)
  const speedController = 20

  const idleIncomePerSecond = computed(() => {
    const partsPerSecond = upgrades.value?.creationSpeed?.power || 0 / currentPattern.value!.creationTime
    return partsPerSecond * currentPattern.value!.baseValue * speedController * upgrades.value?.sellMultiplier?.power || 0 * gameStore.prestigeMultiplier.value
  })

  function applyOfflineProgress() {
    const lastOnline = gameStore.lastOnline.value
    if (!lastOnline) return

    const elapsedSeconds = (Date.now() - Number(lastOnline)) / 1000
    if (elapsedSeconds > 5) {
      const reward = elapsedSeconds * idleIncomePerSecond.value
      money.value += Math.floor(reward)
      offlineReward.value = Math.floor(reward)
      showOfflinePopup.value = true
      
      saveGame()

      setTimeout(closeOfflinePopup, 6000)
    }
  }

  function closeOfflinePopup() {
    showOfflinePopup.value = false
    offlineReward.value = 0
  }

  return { showOfflinePopup, offlineReward, applyOfflineProgress, idleIncomePerSecond }
}