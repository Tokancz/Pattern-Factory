<template>
  <article class="login">
    <div>
      <h1>Pattern Factory</h1>
      <p>Welcome to the Pattern Factory!</p>
      <div class="loginForm">
        <input
          v-model="localFactory"
          maxlength="15"
          placeholder="Factory name"
        />
        <input
          v-model="localUser"
          maxlength="15"
          placeholder="Your name"
        />

        <button @click="submit">Start</button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { setFactoryName, setUserName } from "@/stores/useGameStore"

const localFactory = ref("")
const localUser = ref("")

function submit() {
  setFactoryName(localFactory.value)
  setUserName(localUser.value)
}

</script>

<style lang="scss">
.login {
  @include flexRow();
  width: 100%;
  height: 100dvh;

  > div {
    width: 60%;
    @include flexColumn(30px);
    padding: 60px 20px;
    background-color: var(--primary);

    h1 {
      font-size: 4em;
      color: var(--white);
    }
    p {
      font-size: 2em;
      color: var(--white);
    }

    .loginForm {
      @include flexColumn(20px);
      padding: 30px;
      
      input {
        padding: 10px;
        font-size: 1.5em;
        border-radius: 4px;
        border: var(--gray) solid 1px;
      }
      button {
        width: 250px;
        height: 40px;
        @include flexRow();
        background-color: var(--lightgray);
        color: var(--darkgray);
        border-radius: 8px;
        border: 1px groove var(--darkgray);
        font-size: 2em;
        cursor: pointer;
      }
    }
  }
}

</style>
