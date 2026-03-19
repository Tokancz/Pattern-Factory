import { ref, computed } from "vue"
import { gameStore } from '@/stores/useGameStore'
import { useSaveSystem } from "./useSaveSystem"

const { money, upgrades, currentPattern } = gameStore
const { saveGame } = useSaveSystem()

export function useOffline(speedController = 20) {
  const showOfflinePopup = ref(false)
  const offlineReward = ref(0)

  // --- REAL-TIME INCOME PER SECOND (factory loop style) ---
  const incomePerSecond = computed(() => {
    const creationSpeed = upgrades.value.creationSpeed?.power || 0
    const prestige = gameStore.prestigeMultiplier.value
    const sellMul = upgrades.value.sellMultiplier?.power || 1
    const patternValue = currentPattern.value?.baseValue || 0
    const patternTime = currentPattern.value?.creationTime || 1

    const progressPerSecond = creationSpeed * prestige * speedController
    const partsPerSecond = progressPerSecond / patternTime
    return partsPerSecond * patternValue * sellMul
  })

  // --- IDLE / OFFLINE INCOME PER SECOND ---
  const idleIncomePerSecond = computed(() => {
    const offlineMul = upgrades.value.offlineMultiplier?.power ?? 1
    return incomePerSecond.value * offlineMul
  })

  function applyOfflineProgress() {
    const lastOnline = gameStore.lastOnline.value
    if (!lastOnline) return

    const elapsedSeconds = (Date.now() - Number(lastOnline)) / 1000
    if (elapsedSeconds <= 5) return

    // Total offline reward
    const reward = elapsedSeconds * idleIncomePerSecond.value

    // Apply offline cap
    const offlineCap = upgrades.value.offlineCap?.power ?? Infinity
    const finalReward = Math.min(reward, offlineCap)

    money.value += Math.floor(finalReward)
    offlineReward.value = Math.floor(finalReward)
    showOfflinePopup.value = true

    saveGame()
    setTimeout(closeOfflinePopup, 6000)
  }

  function closeOfflinePopup() {
    showOfflinePopup.value = false
    offlineReward.value = 0
  }

  return {
    showOfflinePopup,
    offlineReward,
    applyOfflineProgress,
    incomePerSecond,       // active factory income per second
    idleIncomePerSecond,    // offline / idle income per second
    closeOfflinePopup
  }
}