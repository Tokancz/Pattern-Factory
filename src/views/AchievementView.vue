<template>
  <Panel title="Milestones">
    <div class="achievements">
      <p class="summary">
        Unlocked <strong>{{ store.unlockedCount }}</strong> / {{ store.total }}
      </p>

      <ul class="achievement-grid">
        <li
          v-for="a in achievements"
          :key="a.id"
          class="achievement"
          :class="{ unlocked: store.isUnlocked(a.id) }"
        >
          <i :class="a.icon" class="icon" aria-hidden="true"></i>
          <div class="text">
            <span class="name">{{ a.name }}</span>
            <span class="desc">{{ store.isUnlocked(a.id) ? a.description : "Locked" }}</span>
          </div>
          <i
            class="status fa-solid"
            :class="store.isUnlocked(a.id) ? 'fa-circle-check' : 'fa-lock'"
            aria-hidden="true"
          ></i>
        </li>
      </ul>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import Panel from "@/components/system/Panel.vue"
import { ACHIEVEMENTS } from "@/data/achievements"
import { useAchievementStore } from "@/stores/achievement"

const store = useAchievementStore()
const achievements = ACHIEVEMENTS
</script>

<style scoped lang="scss">
.achievements {
  @include flexColumn(16px, start, stretch);
  width: 100%;
  height: 100%;

  .summary {
    font-size: 1.2em;
    flex: 0 0 auto;
    strong { color: var(--primary); }
  }

  .achievement-grid {
    @include list-reset;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    width: 100%;
    // Scroll inside the panel instead of overflowing the shop area.
    flex: 1;
    min-height: 0;
    max-height: 60vh;
    overflow-y: auto;
    align-content: start;
    padding-right: 4px;

    @include bp-below("lg") { grid-template-columns: 1fr; }
  }

  .achievement {
    @include flexRow(14px, start, center);
    padding: 12px 16px;
    border: 2px solid var(--secondary);
    background: rgba(138, 0, 255, 0.08);
    opacity: 0.55;
    transition: opacity 0.2s ease, border-color 0.2s ease, transform 0.15s ease;

    .icon {
      font-size: 1.6em;
      flex: 0 0 32px;
      text-align: center;
      color: var(--white);
      opacity: 0.6;
    }

    .text {
      @include flexColumn(2px, center, start);
      flex: 1;
      min-width: 0;

      .name {
        font-size: 1.1em;
        font-weight: bold;
      }
      .desc {
        font-size: 0.9em;
        opacity: 0.75;
      }
    }

    .status {
      font-size: 1.2em;
      flex: 0 0 auto;
      opacity: 0.5;
    }

    &.unlocked {
      opacity: 1;
      border-color: var(--primary);
      background: rgba(192, 254, 4, 0.08);

      .icon   { color: var(--primary); opacity: 1; }
      .status { color: var(--primary); opacity: 1; }
    }
  }
}
</style>
