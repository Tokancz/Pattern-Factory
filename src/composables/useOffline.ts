import { ref, computed } from "vue"

export function useOffline(
  money: any,
  currentPattern: any,
  upgrades: any,
  prestigeMultiplier: any
) {
  const showOfflinePopup = ref(false)
  const offlineReward = ref(0)
  const speedController = 20

  const idleIncomePerSecond = computed(() => {
    const partsPerSecond = upgrades.creationSpeed.power / currentPattern.value!.creationTime
    return partsPerSecond * currentPattern.value!.baseValue * speedController * upgrades.sellMultiplier.power * prestigeMultiplier.value
  })

  function applyOfflineProgress() {
    const lastOnline = localStorage.getItem("lastOnline")
    if (!lastOnline) return

    const elapsedSeconds = (Date.now() - Number(lastOnline)) / 1000
    if (elapsedSeconds > 5) {
      const reward = elapsedSeconds * idleIncomePerSecond.value
      money.value += Math.floor(reward)
      offlineReward.value = Math.floor(reward)
      showOfflinePopup.value = true
      localStorage.setItem("money", money.value.toString())
      localStorage.setItem("lastOnline", Date.now().toString())

      setTimeout(closeOfflinePopup, 6000)
    }
  }

  function closeOfflinePopup() {
    showOfflinePopup.value = false
    offlineReward.value = 0
  }

  return { showOfflinePopup, offlineReward, applyOfflineProgress }
}