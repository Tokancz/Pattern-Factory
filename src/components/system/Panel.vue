<template>
  <div class="panel">
    <hr>
    <div class="panelHeader">
      <h2>{{ title }}</h2>
      <p>X</p>
    </div>
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
  width: 100%;
  height: 100%;
  @include flexColumn(0, center, start);
  padding: 20px 40px;

  hr {
    width: 100%;
    border: 1px solid var(--white);
  }
  .panelHeader {
    width: 100%;
    @include flexRow(0, space-between);
    
    color: var(--white);
    font-family: "ivy-presto";
    line-height: 1;

    h2 {
      font-size: 3em;
      text-decoration: underline;
    }
    p {
      font-size: 3em;
    }
  }
  .content {
    width: 100%;
    height: 100%;

    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: 20px;
    
    padding-top: 20px;
  }
}
</style>