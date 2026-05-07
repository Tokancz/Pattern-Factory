<template>
  <div class="panel">
    <hr>
    <div class="panelHeader">
      <h2>{{ title }}</h2>
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
  @include flexColumn(20px, start);
  position: relative;
  width: 100%;
  padding: 20px 40px;

  @include bp-below("lg") { padding: 10px 16px; }

  hr {
    position: absolute;
    width: 90%;
    border: 1px solid var(--white);
  }

  .panelHeader {
    @include flexRow(0, space-between);
    width: 100%;
    color: var(--white);
    font-family: "ivy-presto";
    line-height: 1;

    h2 {
      font-size: 3em;
      text-decoration: underline;

      @include bp("sm") { font-size: 2.5em; }
    }
  }

  .content {
    @include flexColumn();
    width: 100%;
    height: 100%;
  }
}
</style>