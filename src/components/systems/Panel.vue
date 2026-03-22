<template>
  <div class="panel">
    <h2>{{ title }}</h2>
    <div class="content">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<style scoped lang="scss">
.panel {
  border: 1px solid #C0FE04;
  padding: 10px;
  width: 250px;

  h2 {
    color: #8A00FF;
  }
}
</style>