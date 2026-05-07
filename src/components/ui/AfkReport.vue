<template>
  <Transition name="afk-fade">
    <div
      v-if="open"
      class="afk-overlay"
      role="dialog"
      aria-modal="true"
      @click.self="dismiss"
    >
      <div class="afk-panel">
        <h2>WELCOME BACK</h2>
        <p class="afk-time">You were AFK for <span>{{ awayLabel }}</span></p>

        <ul class="afk-rewards">
          <li v-if="report.money > 0">
            <abbr title="In-Game Money">IGM</abbr>
            <span>+{{ formatNumber(report.money) }}</span>
          </li>
          <li v-if="report.dc > 0">
            <abbr title="Dark Coins">DC</abbr>
            <span>+{{ formatNumber(report.dc) }}</span>
          </li>
          <li v-if="report.exp > 0">
            <abbr title="Experience">EXP</abbr>
            <span>+{{ formatNumber(report.exp) }}</span>
          </li>
          <li v-if="report.prestigePoints > 0">
            <abbr title="Pending Prestige Points (convert by prestiging)">Pending PP</abbr>
            <span>+{{ formatNumber(report.prestigePoints) }}</span>
          </li>
          <li v-if="!hasAnyGain" class="empty">
            No production while you were away.
          </li>
        </ul>

        <p v-if="report.cappedSeconds > 0" class="afk-capped">
          Offline cap reached &mdash; {{ cappedLabel }} of idle time was lost.
          Upgrade <strong>Not Connected</strong> to extend it.
        </p>

        <button type="button" class="afk-close" @click="dismiss">
          Continue
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { formatNumber } from "@/utils/format"

export interface AfkReportData {
  awaySeconds: number
  cappedSeconds: number
  money: number
  dc: number
  exp: number
  prestigePoints: number
}

const props = defineProps<{
  open: boolean
  report: AfkReportData
}>()

const emit = defineEmits<{ (e: "close"): void }>()

function dismiss() { emit("close") }

function formatDuration(s: number): string {
  if (s < 60) return `${Math.floor(s)}s`
  if (s < 3600) {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return sec ? `${m}m ${sec}s` : `${m}m`
  }
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return m ? `${h}h ${m}m` : `${h}h`
}

const awayLabel = computed(() => formatDuration(props.report.awaySeconds))
const cappedLabel = computed(() => formatDuration(props.report.cappedSeconds))

const hasAnyGain = computed(() =>
  props.report.money > 0 ||
  props.report.dc > 0 ||
  props.report.exp > 0 ||
  props.report.prestigePoints > 0
)
</script>

<style scoped lang="scss">
.afk-overlay {
  @include flexColumn(0, center, center);
  position: fixed;
  inset: 0;
  z-index: 600;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.afk-panel {
  @include flexColumn(20px, center, stretch);
  width: min(520px, 92vw);
  padding: 40px 48px;
  background-color: var(--black);
  color: var(--white);
  text-align: center;

  @include bp("sm") { padding: 24px 20px; gap: 14px; }

  h2 {
    font-family: "ivy-presto";
    font-size: 3em;
    color: var(--primary);
    letter-spacing: 2px;

    @include bp("sm") { font-size: 2.2em; }
  }

  .afk-time {
    font-size: 1.1em;

    span {
      color: var(--primary);
      font-weight: bold;
    }
  }

  .afk-rewards {
    @include list-reset;
    @include flexColumn(0, start, stretch);
    border-top: 2px solid var(--primary);
    border-bottom: 2px solid var(--primary);

    li {
      @include flexRow(0, space-between, center);
      padding: 12px 16px;
      font-size: 1.25em;

      @include bp("sm") { padding: 8px 12px; font-size: 1em; }

      abbr {
        text-decoration: none;
        color: var(--primary);
        font-weight: bold;
      }

      span {
        font-variant-numeric: tabular-nums;
        color: var(--white);
      }

      &.empty {
        justify-content: center;
        color: var(--white);
        opacity: 0.7;
        font-size: 1em;
      }
    }
  }

  .afk-capped {
    font-size: 0.9em;
    color: var(--white);
    opacity: 0.8;

    strong { color: var(--primary); }
  }

  .afk-close {
    margin-top: 8px;
    padding: 12px 24px;
    font-size: 1.1em;
    background-color: var(--primary);
    color: var(--black);
    border: 2px solid var(--primary);
    cursor: pointer;
    font-weight: bold;
    transition: 0.2s;

    &:hover {
      background-color: var(--black);
      color: var(--primary);
    }
  }
}

.afk-fade-enter-active,
.afk-fade-leave-active {
  transition: opacity 0.25s ease;
}
.afk-fade-enter-from,
.afk-fade-leave-to {
  opacity: 0;
}
</style>
