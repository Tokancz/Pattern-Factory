import { useGameStore } from "@/stores/game"
import { usePatternStore } from "@/stores/pattern"
import { useSlotStore } from "@/stores/slot"
import { useUpgradeStore } from "@/stores/upgrade"
import { useMachineStore } from "@/stores/machine"
import { useUserStore } from "@/stores/user"

const SAVE_KEY = "pattern-factory-save"

export function saveGame() {
  const game = useGameStore()
  const patterns = usePatternStore()
  const slots = useSlotStore()
  const upgrades = useUpgradeStore()
  const machines = useMachineStore()
  const user = useUserStore()

  const cleanedSlots = slots.slots.map(slots.cleanSlot)

  const data = {
    version: 1,

    game: game.$state,
    patterns: patterns.$state,
    slots: cleanedSlots,
    upgrades: upgrades.$state,
    machines: machines.$state,
    user: user.$state,

    timestamp: Date.now()
  }

  localStorage.setItem(SAVE_KEY, JSON.stringify(data, null, 2))
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return

  const data = JSON.parse(raw)

  const userStore = useUserStore()
  if (data.user) userStore.$patch(data.user)

  const slotsStore = useSlotStore()
  // get default slots from store
  const defaultSlots = slotsStore.getDefaultSlots

  slotsStore.slots = defaultSlots.map((defaultSlot, i) => {
    const saved = data.slots[i] || {}
    return {
      ...defaultSlot,
      ...saved,
      progress: typeof saved.progress === "number" && !isNaN(saved.progress) ? saved.progress : 0,
      speedMultiplier: typeof saved.speedMultiplier === "number" ? saved.speedMultiplier : 1,
      outputMultiplier: typeof saved.outputMultiplier === "number" ? saved.outputMultiplier : 1,
      patternId: saved.patternId ?? defaultSlot.patternId,
      unlocked: typeof saved.unlocked === "boolean" ? saved.unlocked : defaultSlot.unlocked
    }
  })

  // patch other stores
  useGameStore().$patch(data.game)
  usePatternStore().$patch(data.patterns)
  useUpgradeStore().$patch(data.upgrades)
  useMachineStore().$patch(data.machines)

  return data
}

export function startAutoSave() {
  setInterval(() => {
    saveGame()
  }, 5000) // every 5s
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY)
  location.reload()
}