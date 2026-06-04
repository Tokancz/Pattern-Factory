<template>
  <Panel :title="`Glyphs - ${TIER_NAMES[selectedTier]}`">
    <div class="glyph-view">
      <!-- Only show content after first ascension -->
      <div v-if="glyph.ascensionCount > 0" class="glyph-content">
        <!-- Header stats -->
        <div class="glyph-header">
          <div class="stat">
            <p class="label">You have: </p>
            <p class="value">{{ formatNumber(glyph.glyphs) }} Γ</p>
          </div>
          <div class="stat">
            <p class="label">Ascensions: </p>
            <p class="value">{{ glyph.ascensionCount }}</p>
          </div>
        </div>

        <!-- Tier tabs -->
        <nav class="tier-tabs" role="tablist" aria-label="Glyph tiers">
          <button
            v-for="tier in [1, 2, 3, 4] as const"
            :key="tier"
            type="button"
            role="tab"
            class="tier-tab"
            :class="{ active: selectedTier === tier, locked: !glyph.isTierUnlocked(tier) }"
            :aria-selected="selectedTier === tier"
            @click="selectTier(tier)"
          >
            Tier {{ tier }}
          </button>
        </nav>

        <!-- Current tier content -->
        <div class="tier-content">
          <p v-if="!glyph.isTierUnlocked(selectedTier)" class="lock-note">
            (buy {{ TIER_UNLOCK_REQUIREMENT }} Tier {{ selectedTier - 1 }} to unlock)
          </p>

          <ul class="upgrade-grid">
            <li
              v-for="upgrade in upgradesInTier(selectedTier)"
              :key="upgrade.id"
              class="glyph-card"
              :class="{
                owned:      glyph.upgradeLevel(upgrade.id) >= upgrade.maxLevel,
                affordable: glyph.upgradeLevel(upgrade.id) < upgrade.maxLevel && glyph.canBuyUpgrade(upgrade.id),
                locked:     !glyph.isTierUnlocked(upgrade.tier)
              }"
            >
              <h4 class="upgrade-name">
                {{ upgrade.name }}
                <span v-if="upgrade.maxLevel > 1" class="upgrade-level">
                  {{ glyph.upgradeLevel(upgrade.id) }}/{{ upgrade.maxLevel }}
                </span>
              </h4>
              <p class="upgrade-desc">{{ upgrade.description }}</p>
              <button
                v-if="glyph.upgradeLevel(upgrade.id) >= upgrade.maxLevel"
                type="button"
                class="upgrade-btn owned-btn"
                disabled
              >{{ upgrade.maxLevel > 1 ? "MAX" : "OWNED" }}</button>
              <button
                v-else
                type="button"
                class="upgrade-btn"
                :disabled="!glyph.canBuyUpgrade(upgrade.id)"
                @click="glyph.buyUpgrade(upgrade.id)"
              >{{ glyph.nextLevelCost(upgrade.id) }} Γ</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- Locked message -->
      <div v-else class="glyph-locked">
        <p>Ascend to unlock the Glyph Tree.</p>
        <p class="hint">Complete level {{ game.ascendLevel }} and visit the Recursion tab to ascend.</p>
      </div>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import { ref } from "vue"
import Panel from "@/components/system/Panel.vue"
import { useGameStore } from "@/stores/game"
import { useGlyphStore } from "@/stores/glyph"
import { formatNumber } from "@/utils/format"
import { playSound } from "@/utils/sound"
import {
  GLYPH_UPGRADES,
  GLYPH_UPGRADE_ORDER,
  TIER_NAMES,
  TIER_UNLOCK_REQUIREMENT,
  type GlyphUpgrade,
  type GlyphUpgradeTier
} from "@/data/glyphUpgrades"

const glyph = useGlyphStore()
const game  = useGameStore()

function upgradesInTier(tier: GlyphUpgradeTier): GlyphUpgrade[] {
  return GLYPH_UPGRADE_ORDER
    .map(id => GLYPH_UPGRADES[id])
    .filter((u): u is GlyphUpgrade => !!u && u.tier === tier)
}

const selectedTier = ref<1 | 2 | 3 | 4>(1)

function selectTier(tier: 1 | 2 | 3 | 4) {
  if (selectedTier.value !== tier) playSound("tabClick")
  selectedTier.value = tier
}
</script>

<style scoped lang="scss">
.glyph-view {
  @include flexColumn(20px, start, stretch);
  width: 100%;
  height: 100%;
  min-width: 0;
}

.glyph-header {
  @include flexRow(20px, start, center);
  flex-wrap: wrap;
  font-size: 1.2em;
  padding-bottom: 10px;

  @include bp("md") { font-size: 1em; }

  .stat {
    @include flexRow(10px, start);

    .label {
      font-size: 0.85em;
      opacity: 0.7;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .value {
      font-size: 1.3em;
      color: var(--secondary);
      font-weight: bold;
      font-family: monospace;
    }
  }
}

.tier-tabs {
  @include flexRow(0, start, stretch);
  width: 100%;
  border-bottom: 2px solid var(--white);
  margin-bottom: 10px;
  gap: 0;

  .tier-tab {
    padding: 8px 20px;
    background: transparent;
    color: var(--white);
    border: 1px solid transparent;
    border-bottom: none;
    cursor: pointer;
    font-size: 1em;
    font-weight: bold;
    letter-spacing: 0.1em;
    transition: background 0.2s, color 0.2s;
    flex: 1;
    user-select: none;

    @include bp("sm") { padding: 6px 12px; font-size: 0.9em; }

    &:hover:not(.locked) { background: rgba(138, 0, 255, 0.15); }

    &.active {
      background: var(--secondary);
      color: var(--white);
    }

    &.locked {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
}

.tier-content {
  @include flexColumn(12px, start, stretch);
  flex: 1;
  min-height: 0;
  overflow-y: auto;

  .lock-note {
    font-size: 1em;
    letter-spacing: 0;
    opacity: 0.8;
    text-transform: none;
    font-style: italic;
  }
}


.upgrade-grid {
  @include list-reset;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;

  @include bp("md") {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }

  @include bp("sm") {
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px;
  }
}

.glyph-card {
  @include flexColumn(8px, start, stretch);
  padding: 14px 16px;
  background: var(--white);
  color: var(--black);
  transition: opacity 0.2s, border-color 0.2s, box-shadow 0.2s;
  min-width: 0;
  overflow: hidden;

  @include bp("md") { padding: 12px 14px; }
  @include bp("sm") { padding: 10px 12px; font-size: 0.9em; }

  &.affordable {
    box-shadow: 0 0 12px rgba(138, 0, 255, 0.3);
  }
  &.locked {
    opacity: 0.35;
  }

  .upgrade-name {
    @include flexRow(6px, space-between, center);
    flex-wrap: wrap;
    font-size: 1em;
    font-weight: bold;
    color: var(--secondary);
    letter-spacing: 0.05em;
    word-break: break-word;
    min-width: 0;

    .upgrade-level {
      font-size: 0.75em;
      color: var(--black);
      opacity: 0.7;
      letter-spacing: 0;
      font-family: monospace;
      flex-shrink: 0;
    }
  }

  .upgrade-desc {
    font-size: 0.85em;
    opacity: 0.85;
    word-break: break-word;
    flex: 1;
  }

  .upgrade-btn {
    margin-top: auto;
    padding: 6px 10px;
    font-size: 0.85em;
    font-weight: bold;
    background: var(--secondary);
    color: var(--black);
    border: none;
    cursor: pointer;
    transition: 0.2s;
    user-select: none;

    &:hover:not(:disabled) {
      background: var(--white);
      color: var(--secondary);
      box-shadow: inset 0 0 0 2px var(--secondary);
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;
    }

    &.owned-btn {
      background: transparent;
      color: var(--secondary);
      border: 2px solid var(--secondary);
      opacity: 1;
    }
  }
}

.glyph-locked {
  @include flexColumn(16px, center, center);
  height: 100%;
  font-size: 1.1em;
  color: var(--white);
  opacity: 0.7;

  p {
    text-align: center;

    &.hint {
      font-size: 0.9em;
      opacity: 0.6;
    }
  }
}
</style>
