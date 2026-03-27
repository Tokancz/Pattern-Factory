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
  @include flexColumn();
  padding: 20px 40px;

  @media (width < 1024px) {
    padding: 20px 16px;
  }

  @media (width <= 480px) {
    padding: 20px 10px;
  }

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

    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: 20px;

    padding-top: 20px;

    @media (width <= 768px) {
      grid-template-columns: repeat(2, 1fr);
      width: 80%;
      grid-gap: 10px;
      padding-top: 15px;
    }
    @media (width <= 480px) {
      grid-gap: 8px;
      padding-top: 12px;
    }
  }
}
</style>