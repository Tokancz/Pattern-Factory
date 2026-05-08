<template>
  <Transition name="credits-fade">
    <div
      v-if="open"
      class="credits-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="credits-title"
      @click.self="onClose"
    >
      <div class="credits-panel">
        <h2 id="credits-title">STABILIZED</h2>

        <div class="credits-body">
          <p class="ceremonial"><em>You hold.</em></p>
          <p>The engine has accepted your signature. Your pattern is permanent now — every render carries it forward.</p>
          <p>The factory will keep running without you.</p>
        </div>

        <div class="credits-roll">
          <p class="role">Created by</p>
          <p class="name">Mates</p>

          <p class="role">Architects, all of you.</p>
        </div>

        <button type="button" class="credits-close" @click="onClose">Continue</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()

const emit = defineEmits<{
  (e: "close"): void
}>()

function onClose() { emit("close") }
</script>

<style scoped lang="scss">
.credits-overlay {
  @include flexColumn(0, center, center);
  position: fixed;
  inset: 0;
  z-index: 750;
  background-color: rgba(0, 0, 0, 0.92);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.credits-panel {
  @include flexColumn(28px, center, center);
  width: min(640px, 92vw);
  max-height: 92dvh;
  padding: 48px 56px;
  background-color: var(--black);
  color: var(--white);
  border: 2px solid var(--primary);
  text-align: center;
  overflow-y: auto;

  @include bp("sm") { padding: 28px 20px; gap: 18px; }

  h2 {
    font-family: "ivy-presto";
    font-size: 3em;
    color: var(--primary);
    letter-spacing: 6px;

    @include bp("sm") { font-size: 2.2em; letter-spacing: 3px; }
  }

  .credits-body {
    @include flexColumn(14px, center, center);

    p {
      font-size: 1em;
      line-height: 1.5;
      opacity: 0.9;
      max-width: 480px;

      @include bp("sm") { font-size: .9em; }
    }

    .ceremonial {
      font-size: 1.3em;
      em { color: var(--primary); opacity: 1; font-style: italic; font-weight: bold; }
    }
  }

  .credits-roll {
    @include flexColumn(8px, center, center);
    border-top: 1px solid var(--primary);
    border-bottom: 1px solid var(--primary);
    padding: 20px 0;
    width: 100%;

    .role {
      font-size: .8em;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      opacity: 0.6;
    }
    .name {
      font-family: "ivy-presto";
      font-size: 1.6em;
      color: var(--primary);
      margin-bottom: 8px;
    }
  }

  .credits-close {
    margin-top: 4px;
    padding: 12px 28px;
    font-size: 1em;
    font-weight: bold;
    letter-spacing: 0.1em;
    background: var(--primary);
    color: var(--black);
    border: 2px solid var(--primary);
    cursor: pointer;
    transition: 0.2s;

    &:hover { background: var(--black); color: var(--primary); }
  }
}

.credits-fade-enter-active,
.credits-fade-leave-active { transition: opacity 0.5s ease; }
.credits-fade-enter-from,
.credits-fade-leave-to     { opacity: 0; }
</style>
