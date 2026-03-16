import { ref } from "vue"

export function usePrestige(
  money: any,
  ownedPatterns: any,
  patterns: any,
  upgrades: any,
  ownedMachines: any,
  machines: any,
  parts: any,
  creatingProgress: any,
  currentPattern: any
) {
  const prestigePoints = ref(Number(localStorage.getItem("prestigePoints")) || 0)
  const prestigeMultiplier = ref(Number(localStorage.getItem("prestigeMultiplier")) || 1)

  function calculatePrestigeReward() {
    return Math.floor(Math.sqrt(money.value / 1_000_000_000))
  }

  function prestige() {
    const reward = calculatePrestigeReward()
    if (reward <= 0) return

    prestigePoints.value += reward
    prestigeMultiplier.value = 1 + prestigePoints.value * 0.05

    money.value = 0
    ownedPatterns.value = ["basic"]
    localStorage.setItem("ownedPatterns", JSON.stringify(ownedPatterns.value))
    Object.values(patterns).forEach(p => { p.owned = p.id === "basic" })

    Object.values(upgrades).forEach(upgrade => {
      upgrade.lvl = 1
      upgrade.power = 1
      upgrade.value = 100
      localStorage.removeItem(`upgrade_${upgrade.id}`)
    })

    ownedMachines.value = []
    localStorage.setItem("ownedMachines", JSON.stringify([]))
    machines.forEach(m => m.owned = false)

    parts.value = []
    creatingProgress.value = 0
    currentPattern.value = patterns.basic!

    localStorage.setItem("prestigePoints", prestigePoints.value.toString())
    localStorage.setItem("prestigeMultiplier", prestigeMultiplier.value.toString())
    localStorage.setItem("money", "0")

    alert(`Prestiged! You gained ${reward} prestige points.`)
  }

  return { prestigePoints, prestigeMultiplier, calculatePrestigeReward, prestige }
}