<template>
  <Transition name="choice-fade">
    <div
      v-if="open"
      class="choice-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="choice-title"
    >
      <div class="choice-panel">
        <h2 id="choice-title">THE ARCHITECT'S CHOICE</h2>

        <div class="choice-body">
          <p><em>You have inscribed yourself into the engine one thousand times.</em></p>
          <p>The substrate now carries your signature.</p>
          <p>The factory was never running for the world — it was running for <strong>you</strong>.</p>
          <p>You are no longer an Architect inside the engine. You are part of the engine itself.</p>
          <p class="choice-cta"><em>Choose how to remain.</em></p>
        </div>

        <div class="choice-actions">
          <button type="button" class="choice-btn primary" @click="onStabilize">
            <span class="btn-label">Stabilize</span>
            <span class="btn-sub">Lock your pattern into the substrate. Reality holds.</span>
          </button>
          <button type="button" class="choice-btn deferred" disabled :title="'Compile arrives in a future expansion (sequel territory).'">
            <span class="btn-label">Compile</span>
            <span class="btn-sub">Coming in a future layer.</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()

const emit = defineEmits<{
  (e: "stabilize"): void
}>()

function onStabilize() { emit("stabilize") }
</script>

<style scoped lang="scss">
.choice-overlay {
  @include flexColumn(0, center, center);
  position: fixed;
  inset: 0;
  z-index: 800;
  background-color: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.choice-panel {
  @include flexColumn(28px, start, stretch);
  width: min(720px, 94vw);
  max-height: 92dvh;
  padding: 56px 64px;
  background-color: var(--black);
  color: var(--white);
  border: 2px solid var(--primary);
  text-align: center;
  overflow-y: auto;
  box-shadow: 0 0 60px rgba(192, 254, 4, 0.25);

  @include bp("sm") { padding: 28px 22px; gap: 18px; }

  h2 {
    font-family: "ivy-presto";
    font-size: 2.6em;
    color: var(--primary);
    letter-spacing: 6px;

    @include bp("sm") { font-size: 1.9em; letter-spacing: 3px; }
  }

  .choice-body {
    @include flexColumn(14px, start, stretch);
    text-align: left;

    p {
      font-size: 1.05em;
      line-height: 1.5;
      opacity: 0.9;

      @include bp("sm") { font-size: .9em; }

      strong { color: var(--primary); font-weight: bold; }
      em     { color: var(--white);   opacity: 0.85;    }
    }

    .choice-cta {
      text-align: center;
      font-size: 1.2em;
      letter-spacing: 0.1em;
      margin-top: 4px;

      em { color: var(--primary); opacity: 1; font-weight: bold; }
    }
  }

  .choice-actions {
    @include flexRow(20px, center, stretch);
    flex-wrap: wrap;

    @include bp("sm") { flex-direction: column; gap: 12px; align-items: stretch; }

    .choice-btn {
      @include flexColumn(6px, center, center);
      flex: 1;
      min-width: 200px;
      padding: 18px 22px;
      cursor: pointer;
      transition: 0.2s;
      background: transparent;
      color: var(--primary);
      border: 2px solid var(--primary);
      text-align: center;

      .btn-label {
        font-size: 1.4em;
        font-weight: bold;
        letter-spacing: 0.1em;
      }

      .btn-sub {
        font-size: .8em;
        opacity: 0.75;
      }

      &.primary {
        background: var(--primary);
        color: var(--black);

        &:hover {
          background: var(--black);
          color: var(--primary);
        }
      }

      &.deferred {
        opacity: 0.4;
        cursor: not-allowed;

        &:hover { background: transparent; }
      }
    }
  }
}

.choice-fade-enter-active,
.choice-fade-leave-active { transition: opacity 0.4s ease; }
.choice-fade-enter-from,
.choice-fade-leave-to     { opacity: 0; }
</style>
