<template>
  <div class="panel">
    <div class="panel__head">
      <span class="panel__tag">▸ {{ tag }}</span>
      <h2 class="panel__title">{{ title }}.</h2>
    </div>
    <div class="panel__content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{ title: string }>()

const tag = computed(() => {
  // Strip leading icon/glyph if present and uppercase the title for the tag
  const stripped = props.title.replace(/^[^a-zA-Z]+/, "").trim()
  return stripped.toUpperCase()
})
</script>

<style scoped lang="scss">
.panel {
  display: flex;
  flex-direction: column;
  gap: $s-4;
  width: 100%;
  height: 100%;

  &__head {
    display: flex;
    align-items: baseline;
    gap: $s-3;
    padding-bottom: $s-3;
    border-bottom: 1px solid $border;
  }
  &__tag {
    @include label(11px, $accent);
  }
  &__title {
    font-family: $ff-display;
    font-style: italic;
    font-weight: 700;
    font-size: 32px;
    color: $ink;
    letter-spacing: -.02em;
    line-height: 1;
    margin: 0;
  }
  &__content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
}

@media (max-width: 768px) {
  .panel__title { font-size: 24px; }
}
</style>
