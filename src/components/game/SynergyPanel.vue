<template>
  <div class="synergy-panel" :class="{ open: isOpen }">

    <button
      class="toggle"
      type="button"
      :aria-expanded="isOpen"
      aria-controls="synergy-panel-body"
      @click="isOpen = !isOpen"
    >
      SYNERGIES
      <span v-if="synergy.activeSynergies.length" class="badge" aria-label=", {{ synergy.activeSynergies.length }} active">
        {{ synergy.activeSynergies.length }}
      </span>
    </button>

    <div id="synergy-panel-body" class="panel-body">

      <template v-if="synergy.activeSynergies.length">
        <h3 class="section-label">ACTIVE</h3>
        <article
          v-for="syn in synergy.activeSynergies"
          :key="syn.id"
          class="synergy-item active"
        >
          <header class="synergy-header">
            <span class="synergy-name">{{ syn.name }}</span>
            <span class="type-badge" :class="syn.type">{{ syn.type }}</span>
          </header>
          <p class="synergy-desc">{{ syn.description }}</p>
          <ul class="bonus-list">
            <li
              v-for="(val, pid) in getDisplayBonuses(syn)"
              :key="pid"
            >{{ pid }}: {{ val }}</li>
          </ul>
        </article>
      </template>

      <template v-if="synergy.pendingSynergies.length">
        <h3 class="section-label">ALMOST</h3>
        <article
          v-for="{ synergy: syn, missing } in synergy.pendingSynergies"
          :key="syn.id"
          class="synergy-item pending"
        >
          <header class="synergy-header">
            <span class="synergy-name">{{ syn.name }}</span>
            <span class="type-badge" :class="syn.type">{{ syn.type }}</span>
          </header>
          <p class="missing-label">Add {{ missing }} to activate</p>
        </article>
      </template>

      <p v-if="!synergy.activeSynergies.length && !synergy.pendingSynergies.length" class="empty">
        Place multiple patterns in slots to discover synergies.
      </p>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useSynergyStore } from "@/stores/synergy"
import type { SynergyDef, PatternId } from "@/data/synergies"

const synergy = useSynergyStore()
const isOpen  = ref(false)

// Build a human-readable bonus list for a synergy, amplified by current Overclock level
function getDisplayBonuses(syn: SynergyDef): Record<string, string> {
  const levels  = synergy.patternLevels
  const amp     = synergy.synergyAmplifier
  const raw     = syn.getBonus(levels)
  const result: Record<string, string> = {}

  const allPatterns: PatternId[] = ["square", "triangle", "circle", "cross"]

  for (const pid of allPatterns) {
    const lines: string[] = []

    const outMult = raw.outputMultipliers[pid]
    if (outMult !== undefined && outMult !== 1) {
      const effective = 1 + (outMult - 1) * amp
      lines.push(`+${Math.round((effective - 1) * 100)}% output`)
    }

    const spdMult = raw.speedMultipliers[pid]
    if (spdMult !== undefined && spdMult !== 1) {
      const effective = 1 + (spdMult - 1) * amp
      lines.push(`+${Math.round((effective - 1) * 100)}% speed`)
    }

    if (lines.length) result[pid] = lines.join(", ")
  }

  return result
}
</script>

<style scoped lang="scss">
.synergy-panel {
  width: 100%;
  max-height: calc(100% - 80px);
  background: var(--black);

  .toggle {
    @include flexRow(8px, end);
    width: 100%;
    padding: 10px 20px;
    font-size: 1.25em;
    letter-spacing: 0.05em;
    cursor: pointer;
    color: var(--white);
    background: var(--black);
    border: none;
    transition: background 0.2s;

    &:hover {
      background: var(--primary);
      color: var(--black);

      .badge {
        background: var(--black);
        color: var(--primary);
      }
    }

    .badge {
      @include flexRow(0, center, center);
      background: var(--primary);
      color: var(--black);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 0.85em;
      font-weight: bold;
    }
  }

  .panel-body {
    display: none;
    padding: 12px;
    max-width: 280px;
    max-height: calc(100% - 40px);
    overflow-y: auto;
  }

  &.open .panel-body { @include flexColumn(8px, start, stretch); }

  .section-label {
    font-size: 1em;
    letter-spacing: 0.05em;
    color: var(--primary);
    margin-bottom: 2px;
  }

  .synergy-item {
    padding: 8px;
    border: 1px solid transparent;

    &.active  { border-color: var(--primary); }
    &.pending {
      opacity: 0.45;
      border-color: var(--white);
      border-style: dashed;
    }
  }

  .synergy-header { @include flexRow(10px, space-between, center); }

  .synergy-name {
    font-size: 1em;
    color: var(--primary);
    font-weight: bold;
  }

  .type-badge {
    @include type-badge(0.8em);
    border-width: 1px;
    @include synergy-type-colors;
  }

  .synergy-desc {
    font-size: 0.9em;
    opacity: 0.7;
    margin-bottom: 4px;
  }

  .bonus-list { @include bonus-list(var(--primary)); }

  .missing-label {
    font-size: 0.7em;
    opacity: 0.6;
    font-style: italic;
  }

  .empty {
    font-size: 0.72em;
    opacity: 0.5;
    font-style: italic;
  }
}
</style>
