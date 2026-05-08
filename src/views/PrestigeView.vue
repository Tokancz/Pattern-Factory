<template>
  <Panel title="Recursion">
    <div class="recursion">
      <!-- Sub-tab nav. The Ascension tab is gated on having reached
           level 100 at least once (or having ascended before, which
           keeps the tab visible across runs). -->
      <nav class="sub-tabs" role="tablist" aria-label="Recursion modes">
        <button
          type="button"
          role="tab"
          class="sub-tab"
          :class="{ active: tab === 'prestige' }"
          :aria-selected="tab === 'prestige'"
          @click="tab = 'prestige'"
        >Prestige</button>
        <button
          v-if="ascensionUnlocked"
          type="button"
          role="tab"
          class="sub-tab"
          :class="{ active: tab === 'ascension' }"
          :aria-selected="tab === 'ascension'"
          @click="tab = 'ascension'"
        >Ascension</button>
      </nav>

      <!-- Prestige sub-tab — Re-render -->
      <div v-if="tab === 'prestige'" class="prestige">
        <div class="text-container">
          <p>Re-render this layer of reality. Pending PP banks into spendable Persistence Points.</p>
          <p>Crosses generate <strong>Pending PP</strong> while the engine runs — it inscribes only when you re-render.</p>
          <p>Re-rendering at <strong>1,000,000 IGM</strong> grants bonus PP from accumulated mass.</p>
          <p id="pending-pp">
            Pending PP: <strong>{{ formatNumber(Math.floor(game.pendingPrestigePoints)) }}</strong>
          </p>
          <p id="money-gain">
            Bonus from mass: <strong>{{ game.getMoneyPrestigeGain() }}</strong> PP
          </p>
          <p id="gain">
            Total on re-render: <strong>{{ game.getPrestigeGain() }}</strong> PP
          </p>
          <p id="current-pp">
            You have: <strong>{{ formatNumber(game.prestigePoints) }}</strong> PP
          </p>
        </div>

        <div class="prestige-container">
          <button
            type="button"
            @click="prestige"
            :disabled="!game.canPrestige"
            class="prestige-button"
            :class="{ ready: game.canPrestige }"
            :aria-label="game.canPrestige ? 'Re-render — collapse this run and bank ' + game.getPrestigeGain() + ' PP' : 'Re-render locked — need 1,000,000 IGM or pending PP'"
          >
            <img src="/img/icons/connectdevelop.svg" alt="" aria-hidden="true">
            <p aria-hidden="true">RE-RENDER</p>
          </button>
          <p v-if="!game.canPrestige" class="requirement">
            Need {{ formatNumber(1_000_000) }} IGM or pending PP
          </p>
        </div>
      </div>

      <!-- Ascension sub-tab — Recurse -->
      <div v-else-if="tab === 'ascension'" class="ascension">
        <div class="ascend-row">
          <div class="text-container">
            <p>Recurse one layer deeper into the substrate. <strong>This wipes everything</strong> — IGM, DC, PP, levels, all upgrades and machines — but Glyphs and Glyph upgrades persist forever.</p>
            <p>You earn <strong>1 Γ</strong> for crossing the level-100 threshold, plus any pending Γ accumulated this run.</p>

            <p id="pending-glyphs">
              Pending Γ: <strong>{{ formatNumber(Math.floor(glyph.pendingGlyphs)) }}</strong>
            </p>
            <p id="ascend-gain">
              Total on ascend: <strong>{{ ascendGain }} Γ</strong>
            </p>
            <p id="current-glyphs">
              You have: <strong>{{ formatNumber(glyph.glyphs) }} Γ</strong>
            </p>
            <p id="ascensions">
              Ascensions: <strong>{{ glyph.ascensionCount }}</strong>
            </p>
          </div>

          <div class="ascend-container">
            <button
              type="button"
              @click="onAscendClick"
              :disabled="!game.canAscend"
              class="ascend-button"
              :class="{ ready: game.canAscend, confirming }"
              :aria-label="game.canAscend ? 'Ascend — wipe this layer and gain ' + ascendGain + ' Glyphs' : 'Ascend locked — reach level 100 first'"
            >
              <p aria-hidden="true">{{ confirming ? "CONFIRM ASCEND" : "ASCEND" }}</p>
              <p class="sub" aria-hidden="true">+{{ ascendGain }} Γ</p>
            </button>
            <p v-if="!game.canAscend" class="requirement">
              Reach level 100 to ascend (currently {{ game.level }}).
            </p>
            <p v-else-if="confirming" class="requirement confirm-msg">
              Click again to confirm. This is irreversible.
            </p>
          </div>
        </div>
      </div>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import Panel from "../components/system/Panel.vue"
import { useGameStore } from "@/stores/game"
import { useGlyphStore } from "@/stores/glyph"
import { formatNumber } from "@/utils/format"
import {
  GLYPH_UPGRADES,
  GLYPH_UPGRADE_ORDER,
  TIER_NAMES,
  TIER_UNLOCK_REQUIREMENT,
  type GlyphUpgrade,
  type GlyphUpgradeTier
} from "@/data/glyphUpgrades"

function upgradesInTier(tier: GlyphUpgradeTier): GlyphUpgrade[] {
  return GLYPH_UPGRADE_ORDER
    .map(id => GLYPH_UPGRADES[id])
    .filter((u): u is GlyphUpgrade => !!u && u.tier === tier)
}

const game     = useGameStore()
const glyph    = useGlyphStore()
const prestige = game.prestige

// Ascension sub-tab is shown once the player has reached level 100 at
// least once (or already ascended before — that keeps it visible across
// runs even though prestige resets level to 1).
const ascensionUnlocked = computed(() => game.canAscend || glyph.ascensionCount > 0)

const tab = ref<"prestige" | "ascension">("prestige")

// If the player loses access to the Ascension tab (e.g. ascended back to
// level 1 with ascensionCount=0 — shouldn't happen, but defensive), drop
// them back to Prestige.
watch(ascensionUnlocked, unlocked => {
  if (!unlocked && tab.value === "ascension") tab.value = "prestige"
})

const ascendGain = computed(() => 1 + Math.floor(glyph.pendingGlyphs))

// Two-step confirm: first click arms the button, second click ascends.
// 4-second timeout reverts back to the unarmed state if the player walks
// away. Cheap inline confirmation; no modal needed.
const confirming = ref(false)
let confirmTimer: ReturnType<typeof setTimeout> | null = null

function onAscendClick() {
  if (!game.canAscend) return
  if (!confirming.value) {
    confirming.value = true
    if (confirmTimer) clearTimeout(confirmTimer)
    confirmTimer = setTimeout(() => { confirming.value = false }, 4000)
    return
  }
  if (confirmTimer) { clearTimeout(confirmTimer); confirmTimer = null }
  confirming.value = false
  game.ascend()
}
</script>

<style scoped lang="scss">
.recursion {
  @include flexColumn(20px, start, stretch);
  width: 100%;
  height: 100%;
  min-width: 0;
  // Hide horizontal overflow defensively — long upgrade names should
  // wrap, never trigger a sideways scrollbar on the parent.
  overflow-x: hidden;
}

// ─── Sub-tab nav ─────────────────────────────────────────────────────────
.sub-tabs {
  @include flexRow(0, start, stretch);
  width: 100%;
  border-bottom: 1px solid var(--primary);
  flex-shrink: 0;

  .sub-tab {
    padding: 8px 24px;
    background: transparent;
    color: var(--white);
    border: 1px solid var(--primary);
    border-bottom: none;
    cursor: pointer;
    font-size: 1.1em;
    letter-spacing: 0.05em;
    transition: background .2s, color .2s;
    margin-right: -1px;
    margin-bottom: -1px;
    user-select: none;

    @include bp("sm") { padding: 6px 14px; font-size: 1em; }

    &:hover {
      background: var(--primary);
      color: var(--black);
    }

    &.active {
      background: var(--primary);
      color: var(--black);
      font-weight: bold;
    }
  }
}

// ─── Prestige (existing) ────────────────────────────────────────────────
.prestige {
  @include flexRow(50px, center, center);
  flex: 1;
  font-size: 1.3em;
  padding: 20px 0;

  @include bp("md") {
    flex-direction: column;
    gap: 24px;
    font-size: 1.1em;
    padding: 16px 8px;
  }

  .text-container {
    @include flexColumn(8px, center, start);
    max-width: 60%;

    @include bp("md") { max-width: 100%; }

    p#gain {
      font-size: .85em;
      color: var(--secondary);
      margin-top: 8px;
    }
    p#current-pp {
      font-size: .85em;
      color: var(--white);
      opacity: 0.7;
    }
    .requirement {
      font-size: 0.7em;
      color: var(--secondary);
    }
  }

  .prestige-container {
    @include flexColumn(12px, center, center);

    .prestige-button {
      @include flexColumn(10px, center, center);
      width: 200px;
      padding: 10px 20px;
      border-radius: 5px;
      font-weight: bold;
      opacity: 0.4;
      cursor: not-allowed;
      transition: .3s;

      img { width: 80px; }

      &.ready {
        opacity: 1;
        cursor: pointer;
        box-shadow: 0 0 20px rgba(192, 254, 4, 0.4);

        &:hover {
          background-color: var(--primary);
          transform: scale(1.05);
        }
      }
    }

    > p.requirement { font-size: .7em; }
  }
}

// ─── Ascension ─────────────────────────────────────────────────────────
.ascension {
  @include flexColumn(28px, start, stretch);
  flex: 1;
  font-size: 1.3em;
  padding: 12px 0;
  overflow-y: auto;

  @include bp("md") { font-size: 1.1em; padding: 8px 0; gap: 20px; }
}

.ascend-row {
  @include flexRow(50px, center, center);
  flex-wrap: wrap;

  @include bp("md") { flex-direction: column; gap: 24px; }

  .text-container {
    @include flexColumn(8px, center, start);
    max-width: 60%;
    min-width: 0;

    @include bp("md") { max-width: 100%; }

    p {
      word-break: break-word;
      max-width: 100%;
    }

    p#ascend-gain {
      font-size: .9em;
      color: var(--primary);
      margin-top: 8px;
    }
    p#current-glyphs,
    p#ascensions {
      font-size: .85em;
      color: var(--white);
      opacity: 0.75;
    }
  }

  .ascend-container {
    @include flexColumn(12px, center, center);
    flex-shrink: 0;
    max-width: 100%;

    .ascend-button {
      @include flexColumn(4px, center, center);
      width: 220px;
      max-width: 100%;
      padding: 18px 20px;
      border: 2px solid var(--primary);
      background: transparent;
      color: var(--primary);
      font-weight: bold;
      letter-spacing: 0.1em;
      opacity: 0.4;
      cursor: not-allowed;
      transition: .25s;

      .sub {
        font-size: .75em;
        opacity: 0.8;
      }

      &.ready {
        opacity: 1;
        cursor: pointer;
        box-shadow: 0 0 24px rgba(192, 254, 4, 0.35);

        &:hover {
          background: var(--primary);
          color: var(--black);
          transform: scale(1.04);
        }
      }

      &.confirming {
        background: var(--error);
        color: var(--white);
        border-color: var(--error);
        box-shadow: 0 0 24px rgba(255, 68, 68, 0.5);
        animation: ascendPulse 0.8s ease-in-out infinite;
      }
    }

    .requirement {
      font-size: .75em;
      color: var(--secondary);
      text-align: center;

      &.confirm-msg { color: var(--error); font-weight: bold; }
    }
  }
}

@keyframes ascendPulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.04); }
}
</style>
