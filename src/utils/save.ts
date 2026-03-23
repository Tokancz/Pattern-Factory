import { useGameStore } from "@/stores/game"
import { usePatternStore } from "@/stores/pattern"
import { useSlotStore } from "@/stores/slot"
import { useUpgradeStore } from "@/stores/upgrade"
import { useMachineStore } from "@/stores/machine"

const SAVE_KEY = "pattern-factory-save"

export function saveGame() {
  const game = useGameStore()
  const patterns = usePatternStore()
  const slots = useSlotStore()
  const upgrades = useUpgradeStore()
  const machines = useMachineStore()

  const cleanedSlots = slots.slots.map(slots.cleanSlot)

  const data = {
    version: 1,

    game: game.$state,
    patterns: patterns.$state,
    slots: cleanedSlots,
    upgrades: upgrades.$state,
    machines: machines.$state,

    timestamp: Date.now()
  }

  localStorage.setItem(SAVE_KEY, JSON.stringify(data, null, 2))
}

export function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY)
  if (!raw) return

  const data = JSON.parse(raw)

  const game = useGameStore()
  const patterns = usePatternStore()
  const upgrades = useUpgradeStore()
  const machines = useMachineStore()
  const slotsStore = useSlotStore()

  // patch state (safe merge)
  game.$patch(data.game)
  patterns.$patch(data.patterns)
  slotsStore.$patch(data.slots.map(slotsStore.cleanSlot))

  upgrades.$patch(data.upgrades)
  machines.$patch(data.machines)

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