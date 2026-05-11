<template>
  <div
    v-if="modelValue"
    class="tutorial-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="tutorial-title"
  >
    <div class="tutorial-box">
      <div class="tutorial-content">
        <h2 id="tutorial-title">{{ step!.title }}</h2>
        <p>{{ step!.description }}</p>

        <div v-if="step!.image" class="tutorial-image">
          <img :src="step!.image" alt="" role="presentation" draggable="false"/>
        </div>
      </div>

      <!-- Pinned to the bottom of the fixed-height box via margin-top: auto
           so the Next/Back row sits at the same y on every step instead of
           drifting with title/description/image length. -->
      <div class="tutorial-actions">
        <button v-if="hasPrev" type="button" @click="prevStep" class="button">← Back</button>
        <button v-if="hasNext" type="button" @click="nextStep" class="button">Next →</button>
        <button v-else         type="button" @click="close"    class="button">Got it!</button>
      </div>
    </div>

    <div
      v-if="step!.highlightSelector"
      class="tutorial-highlight"
      :style="highlightStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"

interface TutorialStep {
  title: string
  description: string
  image?: string
  highlightSelector?: string
}

const props = defineProps<{
  steps: TutorialStep[]
  modelValue: boolean
}>()

const emits = defineEmits<{
  (e: "update:modelValue", value: boolean): void
}>()

const index = ref(0)

const step = computed(() => props.steps[index.value])
const hasNext = computed(() => index.value < props.steps.length - 1)
const hasPrev = computed(() => index.value > 0)

function nextStep() { if (hasNext.value) index.value++ }
function prevStep() { if (hasPrev.value) index.value-- }
function close() { emits("update:modelValue", false) }

const highlightStyle = ref({})

function updateHighlight() {
  if (!step.value?.highlightSelector) {
    highlightStyle.value = { display: "none" }
    return
  }
  const el = document.querySelector(step.value.highlightSelector) as HTMLElement
  if (!el) {
    highlightStyle.value = { display: "none" }
    return
  }
  const rect = el.getBoundingClientRect()
  highlightStyle.value = {
    position: "absolute",
    top: `${rect.top + window.scrollY}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    border: "2px solid #FFD700",
    borderRadius: "8px",
    pointerEvents: "none",
    zIndex: 1010,
    transition: "all 0.3s ease"
  }
}

watch(step, () => nextTick(updateHighlight))
</script>

<style scoped lang="scss">
.tutorial-overlay {
  @include flexRow();
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: rgba(0,0,0,0.7);
  z-index: 1000;

  .tutorial-box {
    @include flexColumn(20px, start, stretch);
    width: min(600px, 90vw);
    // Fixed footprint so the actions row (pinned to the bottom) lands at
    // the same y on every step regardless of title / description / image
    // content size.
    min-height: 560px;
    padding: 2rem;
    background: var(--secondary);
    color: var(--white);
    text-align: center;
    box-shadow: 0 0 20px #000;

    @include bp("sm") { padding: 1.25rem; gap: 14px; min-height: 480px; }

    h2 { font-size: 1.8em; font-weight: bold; }
    p  { font-size: 1.2em; }

    .tutorial-content {
      @include flexColumn(20px, start, center);
      width: 100%;

      @include bp("sm") { gap: 14px; }
    }

    .tutorial-actions {
      @include flexRow(50px, center);
      flex-wrap: wrap;
      // Auto top margin absorbs the leftover vertical space inside the
      // flex column, anchoring this row at the bottom of the box.
      margin-top: auto;

      @include bp("sm") { gap: 16px; }

      button { border: none; }
    }

    .tutorial-image {
      img {
        width: 300px;
        max-width: 100%;
        user-select: none;
      }
    }
  }

  .tutorial-highlight {
    box-sizing: border-box;
    background: rgba(255, 255, 0, 0.1);
  }
}
</style>