import { gameStore } from '@/stores/useGameStore'

const SAVE_KEY = "game_save"

export function useSaveSystem() {
  function saveGame() {
    const data = {
      money: gameStore.money.value,
      dc: gameStore.dc.value,
      lvl: gameStore.lvl.value,
      exp: gameStore.exp.value,
      expToNextLvl: gameStore.expToNextLvl.value,
      prestigeMultiplier: gameStore.prestigeMultiplier.value,
      ownedPatterns: gameStore.ownedPatterns.value,
      currentPattern: gameStore.currentPattern.value?.id,
      dailyPattern: gameStore.dailyPattern.value?.id,
      machines: gameStore.machines.value,
      upgrades: gameStore.upgrades.value,
      lastOnline: Date.now(),
      partsSold: gameStore.partsSold.value
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  }

  function loadGame(patterns: any) {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return

    const data = JSON.parse(raw)

    gameStore.money.value = data.money ?? 0
    gameStore.dc.value = data.dc ?? 0
    gameStore.lvl.value = data.lvl ?? 1
    gameStore.exp.value = data.exp ?? 0
    gameStore.expToNextLvl.value = data.expToNextLvl ?? 100
    gameStore.ownedPatterns.value = data.ownedPatterns ?? []
    gameStore.prestigeMultiplier.value = data.prestigeMultiplier ?? 1

    if (data.currentPattern && patterns[data.currentPattern]) {
      gameStore.currentPattern.value = patterns[data.currentPattern]
    }
    if (data.dailyPattern && patterns[data.dailyPattern]) {
      gameStore.dailyPattern.value = patterns[data.dailyPattern]
    }

    gameStore.machines.value.forEach((m, i) => {
      if (data.machines?.[i]) Object.assign(m, data.machines[i])
    })

    Object.keys(gameStore.upgrades.value).forEach(key => {
      if (data.upgrades?.[key]) {
        Object.assign(gameStore.upgrades.value[key], data.upgrades[key])
      }
    })

    gameStore.lastOnline.value = data.lastOnline ?? Date.now()
    gameStore.partsSold.value = data.partsSold ?? 0
  }

  return { saveGame, loadGame }
}