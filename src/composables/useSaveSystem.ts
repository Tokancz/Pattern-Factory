import { gameStore, getDefaultUpgrades, getDefaultMachines } from '@/stores/useGameStore'
import type { Upgrades } from '@/types/Upgrade'

const SAVE_KEY = "game_save"

export function useSaveSystem() {
  function saveGame() {
    const data = {
      factoryName: gameStore.factoryName.value,
      userName: gameStore.userName.value,
      money: gameStore.money.value,
      dc: gameStore.dc.value,
      lvl: gameStore.lvl.value,
      exp: gameStore.exp.value,
      expToNextLvl: gameStore.expToNextLvl.value,
      prestigePoints: gameStore.prestigePoints.value,
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

    gameStore.factoryName.value = data.factoryName || "My Factory"
    gameStore.userName.value = data.userName || "Player"

    gameStore.money.value = data.money ?? 0
    gameStore.dc.value = data.dc ?? 0
    gameStore.lvl.value = data.lvl ?? 1
    gameStore.exp.value = data.exp ?? 0
    gameStore.expToNextLvl.value = data.expToNextLvl ?? 100
    gameStore.ownedPatterns.value = data.ownedPatterns ?? []
    gameStore.prestigePoints.value = data.prestigePoints ?? 0
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

    ;(Object.keys(gameStore.upgrades.value) as (keyof Upgrades)[]).forEach(key => {
      const fallback = getDefaultUpgrades()[key]

      Object.assign(
        gameStore.upgrades.value[key],
        data.upgrades?.[key] ?? fallback
      )
    })

    gameStore.lastOnline.value = data.lastOnline ?? Date.now()
    gameStore.partsSold.value = data.partsSold ?? 0
  }

  function prestigeReset(patterns: any) {
    // --- RESET core progress ---
    gameStore.money.value = 0
    gameStore.dc.value = 0
    gameStore.lvl.value = 1
    gameStore.exp.value = 0
    gameStore.expToNextLvl.value = 100
    gameStore.partsSold.value = 0

    // --- RESET patterns ---
    gameStore.ownedPatterns.value = ["basic"]
    gameStore.currentPattern.value = patterns.basic

    // daily stays or resets depending on your design:
    gameStore.dailyPattern.value = null
    gameStore.dailyPatternTime.value = 0

    // --- RESET machines ---
    gameStore.machines.value = getDefaultMachines()

    // --- RESET upgrades ---
    gameStore.upgrades.value = getDefaultUpgrades()

    // --- RESTORE prestige ---
    gameStore.prestigeMultiplier.value = 1 + gameStore.prestigePoints.value * 0.05

    saveGame()
  }

  return { saveGame, loadGame, prestigeReset }
}
