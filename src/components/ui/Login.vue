<template>
  <div class="login">
    <h2>Welcome to Pattern Factory</h2>
    <div class="form">
      <input v-model="username" placeholder="Username" maxlength="15"/>
      <input v-model="factoryName" placeholder="Factory Name" maxlength="15"/>
      <button @click="handleLogin">Login</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useUserStore } from "@/stores/user"

const user = useUserStore()

const username = ref("")
const factoryName = ref("")

function handleLogin() {
  if (!username.value || !factoryName.value) return
  user.login(username.value, factoryName.value)
}
</script>

<style scoped lang="scss">
.login {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100%;
    height: 100dvh;
    
    @include flexColumn(30px, center);

    background-image: url("/img/LoginBG.png");
    background-size: cover;
    background-position: center;

    h2 {
        display: block;
        text-align: center;
        font-size: 4em;
        width: 600px;
    }
    .form {
        width: 400px;

        @include flexColumn(10px, center);
    }

    input {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
    }

    button {
        padding: 1rem;
        font-size: 1rem;
        cursor: pointer;
    }
}
</style>