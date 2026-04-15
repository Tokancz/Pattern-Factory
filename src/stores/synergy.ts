import { defineStore } from "pinia"
import { computed } from "vue"
import { SYNERGIES, type PatternId, type SynergyDef } from "@/data/synergies"
import { useSlotStore }    from "./slot"
import { usePatternStore } from "./pattern"
import { useMachineStore } from "./machine"

export const useSynergyStore = defineStore("synergy", () => {

  // Which patterns are currently placed in unlocked slots
  const activePatternsInSlots = computed((): PatternId[] => {
    const slots = useSlotStore()
    return slots.slots
      .filter(s => s.unlocked && s.patternId)
      .map(s => s.patternId as PatternId)
  })

  const patternLevels = computed((): Record<PatternId, number> => {
    const p = usePatternStore()
    return {
      square:   p.patterns["square"]?.level   ?? 1,
      triangle: p.patterns["triangle"]?.level ?? 1,
      circle:   p.patterns["circle"]?.level   ?? 1,
      cross:    p.patterns["cross"]?.level    ?? 1,
    }
  })

  // Each Overclock (slotBoost) level adds 8% to synergy bonus magnitude
  const synergyAmplifier = computed((): number => {
    const machines = useMachineStore()
    return 1 + machines.getLevel("slotBoost") * 0.08
  })

  // Synergies whose required patterns are all present in active slots
  const activeSynergies = computed((): SynergyDef[] => {
    const active = activePatternsInSlots.value
    const levels = patternLevels.value

    return SYNERGIES.filter(syn => {
      if (!syn.required.every(p => active.includes(p))) return false
      if (syn.minAvgLevel !== undefined) {
        const avg = syn.required.reduce((s, p) => s + (levels[p] ?? 1), 0) / syn.required.length
        if (avg < syn.minAvgLevel) return false
      }
      return true
    })
  })

  // Synergies that are exactly one pattern away from activating
  const pendingSynergies = computed((): Array<{ synergy: SynergyDef; missing: PatternId }> => {
    const active = activePatternsInSlots.value
    const levels = patternLevels.value
    const activeIds = new Set(activeSynergies.value.map(s => s.id))

    return SYNERGIES
      .filter(syn => !activeIds.has(syn.id))
      .flatMap(syn => {
        const missing = syn.required.filter(p => !active.includes(p))
        if (missing.length !== 1) return []

        // Level-gated synergies: only show pending if level req would be met once pattern added
        if (syn.minAvgLevel !== undefined) {
          const presentLevels = syn.required.filter(p => active.includes(p)).map(p => levels[p] ?? 1)
          const avgIfAdded = [...presentLevels, levels[missing[0]] ?? 1].reduce((a, b) => a + b, 0) / syn.required.length
          if (avgIfAdded < syn.minAvgLevel) return []
        }

        return [{ synergy: syn, missing: missing[0] }]
      })
  })

  // Combined output multiplier for a pattern from all active synergies
  function getOutputMultiplier(patternId: string): number {
    const amp    = synergyAmplifier.value
    const levels = patternLevels.value
    let total = 1
    for (const syn of activeSynergies.value) {
      const bonus = syn.getBonus(levels)
      const mult  = bonus.outputMultipliers[patternId as PatternId] ?? 1
      total *= 1 + (mult - 1) * amp
    }
    return total
  }

  // Combined speed multiplier for a pattern from all active synergies
  function getSpeedMultiplier(patternId: string): number {
    const amp    = synergyAmplifier.value
    const levels = patternLevels.value
    let total = 1
    for (const syn of activeSynergies.value) {
      const bonus = syn.getBonus(levels)
      const mult  = bonus.speedMultipliers[patternId as PatternId] ?? 1
      total *= 1 + (mult - 1) * amp
    }
    return total
  }

  return {
    activePatternsInSlots,
    patternLevels,
    synergyAmplifier,
    activeSynergies,
    pendingSynergies,
    getOutputMultiplier,
    getSpeedMultiplier,
  }
})
