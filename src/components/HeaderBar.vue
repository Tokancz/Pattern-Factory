<template>
<header>
  <div id="header_info">
    <img src="/img/Header.png" alt="Header" draggable="false">

    <h1>{{ factoryName }}</h1>

    <div>
      <p id="user">{{ userName }}</p>
      <p>Lvl: {{ lvl }}</p>
      <p>XP: {{ formatNumber(exp) }}/{{ formatNumber(expToNextLvl) }}</p>
    </div>

    <p v-if="lvlPopUp"> + {{ formatNumber(gainedMoney) }} IGM</p>
  </div>

  <i
    v-if="!mobileMenu && openedShop === ''"
    class="fa-solid fa-bars"
    id="menu"
    @click="$emit('openMenu')"
  ></i>
</header>
</template>

<script setup lang="ts">

defineProps({
  factoryName: String,
  userName: String,
  lvl: Number,
  exp: Number,
  expToNextLvl: Number,
  gainedMoney: Number,
  lvlPopUp: Boolean,
  mobileMenu: Boolean,
  openedShop: String,
  formatNumber: Function
})

defineEmits(["openMenu"])

</script>
<style lang="scss">
header {
    width: 100%;
    max-width: 1440px;
    z-index: 10;
    @include flexRow(0px,space-between);

    div#header_info {
      position: relative;
      width: 600px;
      @include flexColumn(0, center, start);
      color: var(--white);
      padding: 20px 0;

      @media (width <= 425px) {
        width: 280px;
        font-size: .7em;
      }

      img {
        position: absolute;
        height: 100%;
        user-select: none;
      }
      h1 {
        font-size: 3em;
        z-index: 1;
        padding: 0 10px;
      }
      > p {
        position: absolute;
        z-index: 1;
        right: -20px;
        bottom: 0;
        color: var(--black);
        font-size: 1.5em;
      }
      div{
        @include flexRow(10px);
        z-index: 1;
        padding: 0 10px;
        overflow: hidden;

        p {
          color: var(--lightgray);
          font-size: 1.5em;

          &#user {
            color: var(--white);
            font-size: 2em;
          }
        }
      }
    }
    i#menu {
      display: none;
      font-size: 4.5em;
      cursor: pointer;
      color: var(--black);
      
      @media (width < 768px) {
        display: inline;
        padding-right: 20px;
      }
    }
  }
</style>