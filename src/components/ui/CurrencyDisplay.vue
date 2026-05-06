<template>
  <div class="currency" role="status" aria-label="Currency totals">
    <p v-if="showLevel" class="level-display">
      LVL.{{ game.level }}
      <span class="level-bar" aria-hidden="true">{{ levelBar }}</span>
    </p>
    <p>
      <abbr title="In-Game Money">IGM</abbr>
      <span :class="{ 'currency-pulse': pulseMoney }">{{ formatNumber(game.money) }}</span>
    </p>
    <p>
      <abbr title="Dark Coins">DC</abbr>
      <span :class="{ 'currency-pulse': pulseDc }">{{ formatNumber(game.dc) }}</span>
    </p>
    <p>
      <abbr title="Prestige Points">PP</abbr>
      <span :class="{ 'currency-pulse': pulsePp }">
        {{ formatNumber(game.prestigePoints) }}<span
          v-if="game.pendingPrestigePoints >= 1"
          class="pending-pp"
          :class="{ 'currency-pulse': pulsePending }"
          title="Pending PP — convert by prestiging"
        > (+{{ formatNumber(Math.floor(game.pendingPrestigePoints)) }})</span>
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useGameStore } from "@/stores/game"
import { formatNumber } from "@/utils/format"
import { generateBar } from "@/utils/ascii"

defineProps<{
  showLevel?: boolean
}>()

const game = useGameStore()

const levelBar = computed(() =>
  generateBar(game.exp, game.expToNextLevel, 8)
)

const pulseMoney   = ref(false)
const pulseDc      = ref(false)
const pulsePp      = ref(false)
const pulsePending = ref(false)

// Pulse the value briefly when it increases. Re-trigger by toggling the
// class off-on across two animation frames so the keyframe restarts.
function makePulser(flag: { value: boolean }) {
  let timer: ReturnType<typeof setTimeout> | null = null
  return () => {
    flag.value = false
    if (timer) clearTimeout(timer)
    requestAnimationFrame(() => requestAnimationFrame(() => {
      flag.value = true
      timer = setTimeout(() => { flag.value = false }, 600)
    }))
  }
}

const pulseMoneyNow   = makePulser(pulseMoney)
const pulseDcNow      = makePulser(pulseDc)
const pulsePpNow      = makePulser(pulsePp)
const pulsePendingNow = makePulser(pulsePending)

watch(() => game.money,          (n, p) => { if (n > p) pulseMoneyNow() })
watch(() => game.dc,             (n, p) => { if (n > p) pulseDcNow() })
watch(() => game.prestigePoints, (n, p) => { if (n > p) pulsePpNow() })
watch(() => game.pendingPrestigePoints, (n, p) => { if (n > p) pulsePendingNow() })
</script>

<style lang="scss">
.currency {
  grid-area: currency;

  @include flexRow(0, space-between);

  background-color: var(--primary);
  color: var(--black);

  p {
    @include flexColumn(2px, center, center);
    height: 100%;
    padding: 5px 8px;
    flex: 1;
    border-right: 2px solid var(--black);
    text-align: center;
    font-size: .9em;

    &:last-child {
      border-right: none;
    }

    &.level-display {
      @include flexColumn(2px, center, center);
      font-weight: bold;
      flex: 1.4;
    }

    .level-bar {
      font-size: .75em;
      opacity: .75;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .pending-pp {
      font-size: .8em;
      opacity: .7;
      margin-left: 4px;
    }
  }
}
</style>