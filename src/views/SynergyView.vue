<template>
  <Panel title="Resonances">
    <section class="wrapper">
      <aside class="filter-bar" role="tablist" aria-label="Resonance filter">
        <button
          v-for="f in filters"
          :key="f.id"
          type="button"
          role="tab"
          class="filter-btn"
          :class="{ active: filter === f.id }"
          :aria-selected="filter === f.id"
          @click="onFilterChange(f.id)"
        >
          {{ f.label }}
          <span class="filter-count">{{ f.count }}</span>
        </button>
      </aside>

      <div class="grid-wrapper">
        <button
          class="button arrow"
          type="button"
          aria-label="Previous page"
          :class="{ disabled: page === 0 }"
          @click="prevPage"
        >
          <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
        </button>

        <ul v-if="paginatedSynergies.length" class="synergy-grid">
          <li
            v-for="entry in paginatedSynergies"
            :key="entry.syn.id"
            class="synergy-card"
            :class="entry.status"
          >
            <header class="synergy-header">
              <h3 class="synergy-name">{{ entry.syn.name }}</h3>
              <span class="type-badge" :class="entry.syn.type">{{ entry.syn.type }}</span>
            </header>

            <p class="synergy-desc">{{ entry.syn.description }}</p>

            <ul class="required-list">
              <li
                v-for="(count, pid) in entry.syn.requiredCounts"
                :key="pid"
                class="required-item"
              >
                <span class="required-count">{{ count }}×</span>
                <span class="required-name">{{ pid }}</span>
              </li>
            </ul>

            <p v-if="entry.syn.minAvgLevel" class="min-level">
              Min avg level: {{ entry.syn.minAvgLevel }}
            </p>

            <ul v-if="entry.status === 'active'" class="bonus-list">
              <li
                v-for="(val, pid) in getDisplayBonuses(entry.syn)"
                :key="pid"
              >{{ pid }}: {{ val }}</li>
            </ul>

            <p v-if="entry.status === 'almost'" class="status-label almost-label">
              Add 1× {{ entry.missing }} to activate
            </p>
            <p v-if="entry.status === 'active'" class="status-label active-label">ACTIVE</p>
            <p v-if="entry.status === 'locked'" class="status-label locked-label">LOCKED</p>
          </li>
        </ul>

        <p v-else class="empty">No resonances match this filter.</p>

        <button
          class="button arrow"
          type="button"
          aria-label="Next page"
          :class="{ disabled: page >= totalPages - 1 }"
          @click="nextPage"
        >
          <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
    </section>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "../components/system/Panel.vue"
import { computed, ref, watch } from "vue"
import { useSynergyStore } from "@/stores/synergy"
import { playSound } from "@/utils/sound"
import { type SynergyDef, type PatternId, ALL_PATTERNS } from "@/data/synergies"

type FilterId = "active" | "almost" | "all"
type Status = "active" | "almost" | "locked"

interface Entry {
  syn:      SynergyDef
  status:   Status
  missing?: PatternId
}

const PER_PAGE = 4

const synergy = useSynergyStore()
const filter  = ref<FilterId>("active")
const page    = ref(0)

const activeIds = computed(() => new Set(synergy.activeSynergies.map(s => s.id)))
const pendingMap = computed(() => {
  const map = new Map<string, PatternId>()
  for (const { synergy: syn, missing } of synergy.pendingSynergies) map.set(syn.id, missing)
  return map
})

const allEntries = computed((): Entry[] => synergy.visibleSynergies.map(syn => {
  if (activeIds.value.has(syn.id)) return { syn, status: "active" }
  if (pendingMap.value.has(syn.id)) return { syn, status: "almost", missing: pendingMap.value.get(syn.id) }
  return { syn, status: "locked" }
}))

const filters = computed(() => [
  { id: "active" as FilterId, label: "ACTIVE", count: synergy.activeSynergies.length },
  { id: "almost" as FilterId, label: "ALMOST", count: synergy.pendingSynergies.length },
  { id: "all"    as FilterId, label: "ALL",    count: synergy.visibleSynergies.length }
])

const visibleSynergies = computed(() => {
  if (filter.value === "all")    return allEntries.value
  if (filter.value === "active") return allEntries.value.filter(e => e.status === "active")
  return allEntries.value.filter(e => e.status === "almost")
})

const totalPages = computed(() => Math.max(1, Math.ceil(visibleSynergies.value.length / PER_PAGE)))

const paginatedSynergies = computed(() => {
  const start = page.value * PER_PAGE
  return visibleSynergies.value.slice(start, start + PER_PAGE)
})

watch(totalPages, (n) => {
  if (page.value >= n) page.value = Math.max(0, n - 1)
})

function onFilterChange(id: FilterId) {
  if (filter.value !== id) playSound("tabClick")
  filter.value = id
  page.value = 0
}

function nextPage() {
  if (page.value < totalPages.value - 1) { page.value++; playSound("tabClick") }
}

function prevPage() {
  if (page.value > 0) { page.value--; playSound("tabClick") }
}

function getDisplayBonuses(syn: SynergyDef): Record<string, string> {
  const levels = synergy.patternLevels
  const amp    = synergy.synergyAmplifier
  const raw    = syn.getBonus(levels)
  const result: Record<string, string> = {}

  for (const pid of ALL_PATTERNS) {
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
@use "@/styles/views.scss";

.wrapper {
  @include flexRow(20px, start, stretch);
  width: 100%;
  height: 100%;

  @include bp("md") {
    flex-direction: column;
    gap: 10px;
  }
}

.filter-bar {
  @include flexColumn(10px, start, stretch);
  width: 150px;
  height: 100%;
  flex-shrink: 0;

  @include bp("md") {
    flex-direction: row;
    width: 100%;
    height: auto;
    gap: 8px;
    overflow-x: auto;
  }
  @include bp("sm") { gap: 6px; }
}

.filter-btn {
  @include flexRow(10px, space-between, center);
  padding: 10px;
  font-size: 1em;
  color: var(--primary);
  background: var(--black);
  border: 1px solid var(--primary);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;

  &:hover, &.active {
    background: var(--primary);
    color: var(--black);

    .filter-count {
      background: var(--black);
      color: var(--primary);
    }
  }

  @include bp("md") { flex: 1; white-space: nowrap; }
  @include bp("sm") { padding: 6px 10px; font-size: 0.85em; }
}

.filter-count {
  @include flexRow(0, center, center);
  background: var(--primary);
  color: var(--black);
  border-radius: 50px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 0.8em;
  font-weight: bold;
}

.grid-wrapper {
  @include flexRow(10px, center, center);
  flex: 1;
  min-width: 0;
  height: 100%;
}

.synergy-grid {
  @include list-reset;
  flex: 1;

  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;

  @include bp("md") { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  @include bp("sm") { gap: 6px; }
}

.synergy-card {
  @include flexColumn(6px, start, stretch);
  @include card-surface;
  width: 100%;
  padding: 14px 12px;
  min-height: 220px;

  &.almost { opacity: 0.9; }
  &.locked { opacity: 0.55; }

  @include bp("sm") { padding: 10px 8px; min-height: 180px; }
}

.synergy-header {
  @include flexRow(8px, space-between, center);
  width: 100%;
  flex-wrap: wrap;
}

.synergy-name {
  font-size: 1.1em;
  font-weight: bold;
  color: var(--black);

  @include bp("sm") { font-size: 0.95em; }
}

.type-badge {
  @include type-badge;
  @include synergy-type-colors;
}

.synergy-desc {
  font-size: 0.8em;
  opacity: 0.75;

  @include bp("sm") { font-size: 0.7em; }
}

.required-list {
  @include flexRow(0, start, center);
  @include list-reset;
  flex-wrap: wrap;
}

.required-item {
  @include flexRow(3px, start, center);
  font-size: 0.8em;
  padding: 2px 6px;
}

.required-count { font-weight: bold; }

.min-level {
  font-size: 0.7em;
  font-style: italic;
  opacity: 0.7;
}

.bonus-list { @include bonus-list; }

.status-label {
  margin-top: auto;
  font-size: 0.75em;
  letter-spacing: 0.1em;
  text-align: center;
  padding: 4px 0;

  &.active-label {
    color: var(--white);
    background: var(--black);
    font-weight: bold;
  }

  &.almost-label {
    color: var(--secondary);
    font-style: italic;
  }

  &.locked-label {
    color: var(--black);
    opacity: 0.5;
  }
}

.empty {
  flex: 1;
  padding: 40px 0;
  text-align: center;
  font-size: 0.9em;
  font-style: italic;
  opacity: 0.6;
  color: var(--white);
}
</style>
