import { defineStore } from "pinia"
import { computed } from "vue"
import { SYNERGIES, ALL_PATTERNS, type PatternId, type SynergyDef } from "@/data/synergies"
import { useSlotStore }    from "./slot"
import { usePatternStore } from "./pattern"
import { useMachineStore } from "./machine"
import { useGlyphStore }   from "./glyph"

export const useSynergyStore = defineStore("synergy", () => {

  // Current slot composition: how many unlocked, filled slots hold each pattern
  const slotCounts = computed((): Record<PatternId, number> => {
    const slots = useSlotStore()
    const counts: Record<PatternId, number> = { square: 0, triangle: 0, circle: 0, cross: 0, glyph: 0 }
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
      glyph:    p.patterns["glyph"]?.level    ?? 1,
    }
  })

  // Pattern Resonator amplifies the delta of every synergy bonus.
  // Each level adds 15% to the magnitude of the bonus above 1.
  const synergyAmplifier = computed((): number => {
    const machines = useMachineStore()
    return 1 + machines.getLevel("synergyBoost") * 0.15
  })

  // Synergies stay hidden until the player has unlocked the prerequisites
  // that make them reachable — otherwise the resonance list spoils that
  // 5-slot setups and a 5th pattern type exist before the player has any
  // way to engage with them.
  const visibleSynergies = computed((): SynergyDef[] => {
    const slots = useSlotStore()
    const glyph = useGlyphStore()
    const fifthSlotUnlocked  = slots.slots[4]?.unlocked === true
    const glyphPatternOwned  = glyph.hasUpgrade("glyphPattern")
    return SYNERGIES.filter(syn => {
      const total = ALL_PATTERNS.reduce((sum, p) => sum + (syn.requiredCounts[p] ?? 0), 0)
      if (total >= 5 && !fifthSlotUnlocked) return false
      if ((syn.requiredCounts.glyph ?? 0) > 0 && !glyphPatternOwned) return false
      return true
    })
  })

  // Resonance Glyph upgrade allows synergies to fire when the slot
  // composition is one pattern short of the exact requirement. Without
  // it, synergies stay strict (current behaviour).
  // Dual Resonance additionally lets a second synergy fire even when
  // the slot composition has *excess* of its required patterns — capped
  // at 2 active total. The bigger (more demanding) synergy is preferred.
  const activeSynergies = computed((): SynergyDef[] => {
    const counts = slotCounts.value
    const levels = patternLevels.value
    const glyph = useGlyphStore()
    const allowedDeficit = glyph.hasUpgrade("resonance") ? 1 : 0
    const dualActive     = glyph.hasUpgrade("dualResonance")

    const passesLevelGate = (syn: SynergyDef): boolean => {
      if (syn.minAvgLevel === undefined) return true
      const present = ALL_PATTERNS.filter(p => (syn.requiredCounts[p] ?? 0) > 0)
      const avg = present.reduce((s, p) => s + (levels[p] ?? 1), 0) / present.length
      return avg >= syn.minAvgLevel
    }

    const strict = visibleSynergies.value.filter(syn => {
      let totalDeficit = 0
      for (const p of ALL_PATTERNS) {
        const need = syn.requiredCounts[p] ?? 0
        const have = counts[p]
        // Over-stuffed compositions still break the synergy — Resonance
        // only forgives a missing pattern, not extras of the wrong one.
        if (have > need) return false
        totalDeficit += need - have
      }
      if (totalDeficit > allowedDeficit) return false
      return passesLevelGate(syn)
    })

    if (!dualActive || strict.length >= 2) return strict

    // Subset matches: required composition is fully contained in current
    // slot composition (excess of any pattern is fine). These are the
    // candidates Dual Resonance unlocks.
    const strictIds = new Set(strict.map(s => s.id))
    const subsetMatches = visibleSynergies.value
      .filter(syn => {
        if (strictIds.has(syn.id)) return false
        for (const p of ALL_PATTERNS) {
          const need = syn.requiredCounts[p] ?? 0
          if (counts[p] < need) return false
        }
        return passesLevelGate(syn)
      })
      .sort((a, b) => {
        const aTotal = ALL_PATTERNS.reduce((s, p) => s + (a.requiredCounts[p] ?? 0), 0)
        const bTotal = ALL_PATTERNS.reduce((s, p) => s + (b.requiredCounts[p] ?? 0), 0)
        if (aTotal !== bTotal) return bTotal - aTotal
        return a.id.localeCompare(b.id)
      })

    const slots = 2 - strict.length
    return [...strict, ...subsetMatches.slice(0, slots)]
  })

  // Pending = exactly one more slot placement would satisfy requiredCounts.
  // Reports which pattern to add.
  const pendingSynergies = computed((): Array<{ synergy: SynergyDef; missing: PatternId }> => {
    const counts = slotCounts.value
    const levels = patternLevels.value
    const activeIds = new Set(activeSynergies.value.map(s => s.id))

    return visibleSynergies.value
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
    visibleSynergies,
    activeSynergies,
    pendingSynergies,
    getOutputMultiplier,
    getSpeedMultiplier,
  }
})
