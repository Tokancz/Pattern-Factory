<template>
  <div class="panel">
    <hr>
    <div class="panelHeader">
      <h2>{{ title }}</h2>
      <p aria-hidden="true">X</p>
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
  position: relative;
  width: 100%;
  @include flexColumn(20px, start);
  padding: 20px 40px;

  @media (width < 1024px) {
    padding: 0 16px;
  }

  hr {
    position: absolute;
    width: 90%;
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

      @media (width <= 480px) {
        font-size: 2.5em;
      }
    }

    p {
      font-size: 3em;
      cursor: pointer;

      @media (width < 1024px) {
        font-size: 2em;
      }
    }
  }
  .content {
    width: 100%;
    height: 100%;
    @include flexColumn();
  }
}
</style>