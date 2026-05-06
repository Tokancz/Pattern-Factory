import { defineStore } from "pinia"
import { useGameStore } from "./game"
import { usePatternStore } from "./pattern"
import { useUpgradeStore } from "./upgrade"
import { PATTERNS } from "@/data/patterns"
import { saveGame } from "@/utils/save"
import { useMachineStore } from "./machine"
import { useSynergyStore } from "./synergy"
import { playSound } from "@/utils/sound"

interface Slot {
  id: number
  patternId: string | null
  progress: number
  unlocked: boolean
  speedMultiplier: number
  outputMultiplier: number
}

const DEFAULT_SLOTS: Slot[] = [
  { id: 0, patternId: "square", progress: 0, unlocked: true, speedMultiplier: 1, outputMultiplier: 1 },
  { id: 1, patternId: null, progress: 0, unlocked: false, speedMultiplier: 1, outputMultiplier: 1 },
  { id: 2, patternId: null, progress: 0, unlocked: false, speedMultiplier: 1, outputMultiplier: 1 },
  { id: 3, patternId: null, progress: 0, unlocked: false, speedMultiplier: 1, outputMultiplier: 1 }
]

export const useSlotStore = defineStore("slots", {
  state: () => ({
    slots: [...DEFAULT_SLOTS],
    baseSpeed: 1,
    selectedSlotId: null as number | null
  }),

  getters: {
    getDefaultSlots: () => [...DEFAULT_SLOTS]
  },

  actions: {
    getSlotSpeed(slot: Slot) {
      const machines = useMachineStore()
      const upgrades = useUpgradeStore()

      // DC speed multiplier is per-pattern
      const dcSpeedBonus = slot.patternId
        ? upgrades.getDcSpeedMultiplier(slot.patternId)
        : 1

      const synergy = useSynergyStore()
      const synergySpeedBonus = slot.patternId
        ? synergy.getSpeedMultiplier(slot.patternId)
        : 1

      let speed =
        this.baseSpeed *
        slot.speedMultiplier *
        upgrades.getSpeedMultiplier *
        machines.getMultiplier("slotBoost") *
        dcSpeedBonus *
        synergySpeedBonus

      if (slot.id === this.selectedSlotId) {
        speed *= machines.getMultiplier("targetedBoost")
      }

      return speed
    },

    tick(delta: number) {
      const game = useGameStore()
      const patterns = usePatternStore()

      if (!delta || isNaN(delta) || !isFinite(delta)) return
      // 24h ceiling — caller is responsible for the offline-cap upgrade.
      const safeDelta = Math.min(delta, 86400)

      this.slots.forEach(slot => {
        if (!slot.unlocked || !slot.patternId) return

        const maxProgress = PATTERNS[slot.patternId as keyof typeof PATTERNS]?.baseProgress ?? 100
        const speed = this.getSlotSpeed(slot)
        const gain = safeDelta * speed

        if (isNaN(gain) || !isFinite(gain)) return

        slot.progress += gain

        if (slot.progress >= maxProgress) {
          this.completeSlot(slot, game, patterns)
        }

        slot.progress = Math.max(0, Math.min(slot.progress, maxProgress))
      })
    },

    clickSlot(slotId: number) {
      const slot = this.slots.find(s => s.id === slotId)
      if (!slot || !slot.patternId) return
      // Cross is auto-only — clicking does nothing
      if (slot.patternId === "cross") return

      const upgrades = useUpgradeStore()
      slot.progress += upgrades.getClickPower
    },

    completeSlot(slot: Slot, game: ReturnType<typeof useGameStore>, patterns: ReturnType<typeof usePatternStore>) {
      const upgrades = useUpgradeStore()
      const machines = useMachineStore()

      // DC output multiplier is per-pattern
      const dcOutputBonus = slot.patternId
        ? upgrades.getDcOutputMultiplier(slot.patternId)
        : 1

      const synergy = useSynergyStore()
      const synergyOutputBonus = slot.patternId
        ? synergy.getOutputMultiplier(slot.patternId)
        : 1

      let value = patterns.getPatternValue(slot.patternId!) * slot.outputMultiplier
      value *= machines.getMultiplier("outputBoost")
      value *= upgrades.getPrestigeOutputBonus
      value *= dcOutputBonus
      value *= synergyOutputBonus

      if (isNaN(value) || !isFinite(value)) return

      const type = PATTERNS[slot.patternId! as keyof typeof PATTERNS].type

      if (type === "money") game.addMoney(value)
      else if (type === "exp") game.addExp(value)
      else if (type === "dc") game.addDC(value)
      else if (type === "prestige") {
        const prestigeGain = Math.max(1, Math.floor(Math.log2(value + 2)))
        game.addPrestigePoints(prestigeGain)
      }

      const expMultiplier = upgrades.getExpMultiplier * machines.getMultiplier("expMachine")
      const expGain = 1 * expMultiplier

      if (!isNaN(expGain) && isFinite(expGain)) {
        patterns.addExp(slot.patternId!, expGain)
      }

      slot.progress = 0
      playSound("pop")
    },

    assignPattern(slotId: number, patternId: string) {
      const slot = this.slots.find(s => s.id === slotId)
      if (!slot) return
      slot.patternId = patternId
      slot.progress = 0
      saveGame()
    },

    unlockSlot() {
      const slot = this.slots.find(s => !s.unlocked)
      if (!slot) return
      slot.unlocked = true
      saveGame()
    },

    selectSlot(id: number) {
      const machines = useMachineStore()
      if (machines.getLevel("targetedBoost") < 1) return
      this.selectedSlotId = id
    },

    cleanSlot(slot: Slot) {
      return {
        ...slot,
        progress: typeof slot.progress === "number" && !isNaN(slot.progress) ? slot.progress : 0,
        speedMultiplier: typeof slot.speedMultiplier === "number" ? slot.speedMultiplier : 1,
        outputMultiplier: typeof slot.outputMultiplier === "number" ? slot.outputMultiplier : 1
      }
    },

    reset() {
      this.slots = this.getDefaultSlots.map(s => ({ ...s }))
      this.selectedSlotId = null
    }
  }
})