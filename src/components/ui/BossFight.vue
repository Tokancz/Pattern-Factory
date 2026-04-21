<template>
  <Transition name="boss-fade">
    <div v-if="boss.isActive" class="boss-overlay" role="dialog" aria-modal="true">
      <div class="boss-panel">
        <h2>{{ bossName }} Boss</h2>
        <p class="boss-warning">
          Defeat it or lose all your <span>{{ stealLabel }}</span>!
        </p>

        <button
          type="button"
          class="boss-target"
          @click.stop="boss.registerClick()"
          :aria-label="`Hit ${bossName} boss`"
        >
          <img :src="bossIcon" alt="" draggable="false" />
        </button>

        <div class="boss-progress">
          {{ boss.clicks }} / {{ boss.clicksRequired }}
        </div>

        <div class="boss-timer">
          <div class="boss-timer-bar" :style="{ width: timerPercent + '%' }"></div>
          <span>{{ boss.timeLeft.toFixed(1) }}s</span>
        </div>
      </div>
    </div>
  </Transition>

  <Transition name="boss-result-fade">
    <div
      v-if="boss.lastResult"
      class="boss-result"
      :class="boss.lastResult"
      aria-live="polite"
    >
      <p>
        {{ boss.lastResult === 'victory' ? 'VICTORY' : 'DEFEATED' }}
      </p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useBossStore } from "@/stores/boss"
import { STEAL_LABELS } from "@/data/bosses"

const boss = useBossStore()

const bossName = computed(() => {
  if (!boss.activeBossId) return ""
  return boss.activeBossId.charAt(0).toUpperCase() + boss.activeBossId.slice(1)
})

const bossIcon = computed(() => boss.activeTuning?.icon ?? "")

const stealLabel = computed(() => STEAL_LABELS[boss.stealType] ?? boss.stealType)

const timerPercent = computed(() => {
  if (boss.timeLimit === 0) return 0
  return Math.max(0, (boss.timeLeft / boss.timeLimit) * 100)
})
</script>

<style scoped lang="scss">
.boss-overlay {
  position: fixed;
  inset: 0;
  z-index: 500;
  background-color: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  @include flexColumn(0, center, center);
}

.boss-panel {
  @include flexColumn(20px, center, center);
  padding: 40px 60px;

  width: 600px;
  height: 600px;

  min-width: 420px;
  max-width: 90vw;

  background-color: var(--black);
  border-radius: 300px;

  @media (width < 1024px) {
    padding: 28px 32px;
    min-width: 0;
    width: min(420px, 90vw);
  }

  h2 {
    font-size: 2.5em;
    color: var(--error);
    text-transform: uppercase;
    letter-spacing: 4px;
    text-align: center;
  }

  .boss-warning {
    font-size: 1em;
    color: var(--white);
    text-align: center;

    span {
      color: var(--error);
      font-weight: bold;
    }
  }

  .boss-target {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: transform 0.05s ease;
    user-select: none;

    img {
      width: 200px;
      height: 200px;
      pointer-events: none;
      user-select: none;
      -webkit-user-drag: none;
    }

    &:active {
      transform: scale(0.95);
    }
  }

  .boss-progress {
    font-size: 1.5em;
    color: var(--primary);
    font-variant-numeric: tabular-nums;
  }

  .boss-timer {
    width: 70%;
    height: 24px;
    background-color: rgba(255, 255, 255, 0.08);
    border: 2px solid var(--primary);
    border-radius: 4px;
    position: relative;
    overflow: hidden;

    .boss-timer-bar {
      height: 100%;
      background-color: var(--primary);
      transition: width 0.1s linear;
    }

    > span {
      position: absolute;
      inset: 0;
      @include flexRow(0, center, center);
      color: var(--white);
      font-weight: bold;
      font-variant-numeric: tabular-nums;
    }
  }
}

.boss-result {
  position: fixed;
  inset: 0;
  z-index: 501;
  pointer-events: none;
  @include flexRow(0, center, center);
  font-size: 6em;
  background-color: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);

  &.victory {
    color: var(--primary);
  }
  &.defeat {
    color: var(--error);
  }

  p {
    background-color: var(--black);
    padding: 40px 60px;
  }
}

.boss-fade-enter-active,
.boss-fade-leave-active {
  transition: opacity 0.2s ease;
}
.boss-fade-enter-from,
.boss-fade-leave-to {
  opacity: 0;
}

.boss-result-fade-enter-active,
.boss-result-fade-leave-active {
  transition: opacity 0.8s ease;
}
.boss-result-fade-enter-from,
.boss-result-fade-leave-to {
  opacity: 0;
}
</style>
