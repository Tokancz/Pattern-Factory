<template>
  <div class="toast-host" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="t.kind"
        role="status"
        @click="dismissToast(t.id)"
      >
        <i v-if="t.icon" :class="t.icon" class="toast-icon" aria-hidden="true"></i>
        <span class="toast-msg">{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useToasts, dismissToast } from "@/composables/toast"

const toasts = useToasts()
</script>

<style scoped lang="scss">
.toast-host {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1200;
  @include flexColumn(10px, start, center);
  pointer-events: none;
  width: min(440px, 92vw);
}

.toast {
  @include flexRow(12px, start, center);
  width: 100%;
  padding: 12px 18px;
  background: var(--black);
  color: var(--white);
  border: 2px solid var(--primary);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
  cursor: pointer;
  pointer-events: auto;

  .toast-icon {
    font-size: 1.4em;
    color: var(--primary);
    flex: 0 0 auto;
  }

  .toast-msg {
    font-size: 1.05em;
    line-height: 1.3;
  }

  &.achievement {
    border-color: var(--primary);
    background: linear-gradient(90deg, var(--black), rgba(138, 0, 255, 0.35));
  }
}

// Slide down + fade. Honors the global anims-off switch automatically
// because it's transition-based.
.toast-enter-active,
.toast-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(-12px); }
.toast-leave-to     { opacity: 0; transform: translateY(-12px); }
</style>
