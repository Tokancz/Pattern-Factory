<template>
  <Transition name="intro-fade">
    <div
      v-if="open"
      class="intro-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
    >
      <div class="intro-panel">
        <h2 id="intro-title">REALITY ENGINE</h2>

        <div class="intro-body">
          <p><em>You wake into a structure that runs on patterns.</em></p>
          <p>The factory around you is a <strong>Reality Engine</strong>. Squares give it order. Triangles give it energy. Circles give it time. The crosses are paradoxes — leave them be, they resolve on their own.</p>
          <p>You are an <strong>Architect</strong>. Inside this engine, you keep the patterns running, and reality holds.</p>
          <p>Sometimes the engine glitches. <strong>Anomalies</strong> will try to interrupt production. Hold them off.</p>
          <p>Reality bends when you re-render it. It transcends when you recurse. Every layer makes you more permanent.</p>
          <p class="intro-cta"><em>Begin.</em></p>
        </div>

        <div class="intro-actions">
          <button type="button" class="intro-btn primary" @click="onContinue">Continue</button>
          <button type="button" class="intro-btn"         @click="onTutorial">Open Tutorial</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()

const emit = defineEmits<{
  (e: "close"): void
  (e: "open-tutorial"): void
}>()

function onContinue() { emit("close") }
function onTutorial() { emit("open-tutorial"); emit("close") }
</script>

<script lang="ts">
// Keys are scoped per user id so a different account on the same browser
// gets the intro on its first login.
const STORAGE_PREFIX = "patternfactory:seenIntro:"

export function hasSeenIntro(userId: number | undefined): boolean {
  if (userId === undefined) return false
  return localStorage.getItem(STORAGE_PREFIX + userId) === "1"
}

export function markIntroSeen(userId: number | undefined): void {
  if (userId === undefined) return
  localStorage.setItem(STORAGE_PREFIX + userId, "1")
}

export function resetIntroSeen(userId: number | undefined): void {
  if (userId === undefined) return
  localStorage.removeItem(STORAGE_PREFIX + userId)
}
</script>

<style scoped lang="scss">
.intro-overlay {
  @include flexColumn(0, center, center);
  position: fixed;
  inset: 0;
  z-index: 700;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

.intro-panel {
  @include flexColumn(24px, start, stretch);
  width: min(640px, 92vw);
  max-height: 92dvh;
  padding: 48px 56px;
  background-color: var(--black);
  color: var(--white);
  border: 2px solid var(--primary);
  text-align: center;
  overflow-y: auto;

  @include bp("sm") { padding: 28px 22px; gap: 16px; }

  h2 {
    font-family: "ivy-presto";
    font-size: 3em;
    color: var(--primary);
    letter-spacing: 4px;
    text-align: center;

    @include bp("sm") { font-size: 2.2em; letter-spacing: 2px; }
  }

  .intro-body {
    @include flexColumn(14px, start, stretch);
    text-align: left;

    p {
      font-size: 1em;
      line-height: 1.5;
      opacity: 0.9;

      @include bp("sm") { font-size: .9em; }

      strong { color: var(--primary); font-weight: bold; }
      em     { color: var(--white);   opacity: 0.8;     }
    }

    .intro-cta {
      text-align: center;
      font-size: 1.2em;
      margin-top: 4px;
      letter-spacing: 0.1em;

      em { color: var(--primary); opacity: 1; font-weight: bold; }
    }
  }

  .intro-actions {
    @include flexRow(16px, center, center);
    flex-wrap: wrap;

    .intro-btn {
      padding: 12px 28px;
      font-size: 1.1em;
      font-weight: bold;
      cursor: pointer;
      transition: 0.2s;
      background: transparent;
      color: var(--primary);
      border: 2px solid var(--primary);

      &:hover {
        background: var(--primary);
        color: var(--black);
      }

      &.primary {
        background: var(--primary);
        color: var(--black);

        &:hover {
          background: var(--black);
          color: var(--primary);
        }
      }
    }
  }
}

.intro-fade-enter-active,
.intro-fade-leave-active { transition: opacity 0.35s ease; }
.intro-fade-enter-from,
.intro-fade-leave-to     { opacity: 0; }
</style>
