<template>
  <div class="synergy-panel" :class="{ open: isOpen }">

    <button class="toggle" @click="isOpen = !isOpen">
      SYNERGIES
      <span v-if="synergy.activeSynergies.length" class="badge">
        {{ synergy.activeSynergies.length }}
      </span>
    </button>

    <div class="panel-body">

      <template v-if="synergy.activeSynergies.length">
        <p class="section-label">ACTIVE</p>
        <div
          v-for="syn in synergy.activeSynergies"
          :key="syn.id"
          class="synergy-item active"
        >
          <div class="synergy-header">
            <span class="synergy-name">{{ syn.name }}</span>
            <span class="type-badge" :class="syn.type">{{ syn.type }}</span>
          </div>
          <p class="synergy-desc">{{ syn.description }}</p>
          <ul class="bonus-list">
            <li
              v-for="(val, pid) in getDisplayBonuses(syn)"
              :key="pid"
            >{{ pid }}: {{ val }}</li>
          </ul>
        </div>
      </template>

      <template v-if="synergy.pendingSynergies.length">
        <p class="section-label">ALMOST</p>
        <div
          v-for="{ synergy: syn, missing } in synergy.pendingSynergies"
          :key="syn.id"
          class="synergy-item pending"
        >
          <div class="synergy-header">
            <span class="synergy-name">{{ syn.name }}</span>
            <span class="type-badge" :class="syn.type">{{ syn.type }}</span>
          </div>
          <p class="missing-label">Add {{ missing }} to activate</p>
        </div>
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
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 10;

  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    font-size: 0.75em;
    letter-spacing: 0.1em;
    cursor: pointer;
    background: var(--black);
    color: var(--primary);
    border: 1px solid var(--primary);
    border-bottom: none;
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
      background: var(--primary);
      color: var(--black);
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 0.85em;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
  }

  .panel-body {
    display: none;
    flex-direction: column;
    gap: 8px;
    background: var(--black);
    border: 1px solid var(--primary);
    padding: 12px;
    max-width: 280px;
    max-height: 300px;
    overflow-y: auto;
  }

  &.open .panel-body {
    display: flex;
  }

  .section-label {
    font-size: 0.65em;
    letter-spacing: 0.15em;
    color: var(--primary);
    opacity: 0.6;
    margin-bottom: 2px;
  }

  .synergy-item {
    padding: 8px;
    border: 1px solid transparent;

    &.active {
      border-color: var(--primary);
    }

    &.pending {
      opacity: 0.45;
      border-color: var(--white);
      border-style: dashed;
    }
  }

  .synergy-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  .synergy-name {
    font-size: 0.85em;
    color: var(--primary);
    font-weight: bold;
  }

  .type-badge {
    font-size: 0.6em;
    letter-spacing: 0.1em;
    padding: 2px 6px;
    border: 1px solid;

    &.pair   { border-color: #4fc; color: #4fc; }
    &.triple { border-color: #f94; color: #f94; }
    &.full   { border-color: #f4f; color: #f4f; }
  }

  .synergy-desc {
    font-size: 0.7em;
    opacity: 0.7;
    margin-bottom: 4px;
  }

  .bonus-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;

    li {
      font-size: 0.72em;
      color: var(--primary);

      &::before {
        content: "▸ ";
        opacity: 0.5;
      }
    }
  }

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
