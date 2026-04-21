import { defineStore } from "pinia"
import { computed } from "vue"
import { SYNERGIES, ALL_PATTERNS, type PatternId, type SynergyDef } from "@/data/synergies"
import { useSlotStore }    from "./slot"
import { usePatternStore } from "./pattern"
import { useMachineStore } from "./machine"

export const useSynergyStore = defineStore("synergy", () => {

  // Current slot composition: how many unlocked, filled slots hold each pattern
  const slotCounts = computed((): Record<PatternId, number> => {
    const slots = useSlotStore()
    const counts: Record<PatternId, number> = { square: 0, triangle: 0, circle: 0, cross: 0 }
    for (const s of slots.slots) {
      if (s.unlocked && s.patternId && s.patternId in counts) {
        counts[s.patternId as PatternId]++
      }
    }
    return counts
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

  // Pattern Resonator amplifies the delta of every synergy bonus.
  // Each level adds 15% to the magnitude of the bonus above 1.
  const synergyAmplifier = computed((): number => {
    const machines = useMachineStore()
    return 1 + machines.getLevel("synergyBoost") * 0.15
  })

  // Exact-match: synergy fires only when slot counts match requiredCounts for every pattern.
  // Patterns absent from requiredCounts must have count 0 in slots.
  const activeSynergies = computed((): SynergyDef[] => {
    const counts = slotCounts.value
    const levels = patternLevels.value

    return SYNERGIES.filter(syn => {
      for (const p of ALL_PATTERNS) {
        const need = syn.requiredCounts[p] ?? 0
        if (counts[p] !== need) return false
      }
      if (syn.minAvgLevel !== undefined) {
        const present = ALL_PATTERNS.filter(p => (syn.requiredCounts[p] ?? 0) > 0)
        const avg = present.reduce((s, p) => s + (levels[p] ?? 1), 0) / present.length
        if (avg < syn.minAvgLevel) return false
      }
      return true
    })
  })

  // Pending = exactly one more slot placement would satisfy requiredCounts.
  // Reports which pattern to add.
  const pendingSynergies = computed((): Array<{ synergy: SynergyDef; missing: PatternId }> => {
    const counts = slotCounts.value
    const levels = patternLevels.value
    const activeIds = new Set(activeSynergies.value.map(s => s.id))

    return SYNERGIES
      .filter(syn => !activeIds.has(syn.id))
      .flatMap(syn => {
        let deficitTotal = 0
        let missing: PatternId | null = null
        let overfull = false
        for (const p of ALL_PATTERNS) {
          const need = syn.requiredCounts[p] ?? 0
          const have = counts[p]
          if (have > need) { overfull = true; break }
          const diff = need - have
          if (diff === 1) missing = p
          deficitTotal += diff
        }
        if (overfull || deficitTotal !== 1 || !missing) return []

        if (syn.minAvgLevel !== undefined) {
          const present = ALL_PATTERNS.filter(p => (syn.requiredCounts[p] ?? 0) > 0)
          const avg = present.reduce((s, p) => s + (levels[p] ?? 1), 0) / present.length
          if (avg < syn.minAvgLevel) return []
        }

        return [{ synergy: syn, missing }]
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
    slotCounts,
    patternLevels,
    synergyAmplifier,
    activeSynergies,
    pendingSynergies,
    getOutputMultiplier,
    getSpeedMultiplier,
  }
})
