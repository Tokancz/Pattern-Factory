<template>
  <div class="login">
    <h2>Welcome to Pattern Factory</h2>

    <div class="tabs" role="tablist">
      <button type="button" role="tab" :aria-selected="mode === 'login'"    @click="mode = 'login'"    :class="{ active: mode === 'login' }">Login</button>
      <button type="button" role="tab" :aria-selected="mode === 'register'" @click="mode = 'register'" :class="{ active: mode === 'register' }">Register</button>
    </div>

    <form v-if="mode === 'login'" class="form" @submit.prevent="handleLogin" novalidate>
      <label for="login-email">Email
        <input id="login-email" v-model="email" type="email" autocomplete="email" required />
      </label>
      <label for="login-password">Password
        <input id="login-password" v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">{{ loading ? "Logging in..." : "Login" }}</button>
    </form>

    <form v-else class="form" @submit.prevent="handleRegister" novalidate>
      <label for="reg-username">Username
        <input id="reg-username" v-model="username" type="text" autocomplete="username" maxlength="15" required />
      </label>
      <label for="reg-email">Email
        <input id="reg-email" v-model="email" type="email" autocomplete="email" required />
      </label>
      <label for="reg-password">Password
        <input id="reg-password" v-model="password" type="password" autocomplete="new-password" required />
      </label>
      <label for="reg-factory">Factory Name
        <input id="reg-factory" v-model="factoryName" type="text" maxlength="15" required />
      </label>
      <p v-if="error" role="alert" class="error">{{ error }}</p>
      <button type="submit" :disabled="loading">{{ loading ? "Registering..." : "Register" }}</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue"
import { useUserStore } from "@/stores/user"

const emit = defineEmits<{
  (e: "logged-in"): void
}>()

const user = useUserStore()

const mode = ref<"login" | "register">("login")
const email = ref("")
const password = ref("")
const username = ref("")
const factoryName = ref("")
const error = ref("")
const loading = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) return
  error.value   = ""
  loading.value = true
  try {
    await user.login({ email: email.value, password: password.value })
    emit("logged-in")
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Login failed"
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!username.value || !email.value || !password.value || !factoryName.value) return
  error.value   = ""
  loading.value = true
  try {
    await user.register({
      username: username.value,
      email: email.value,
      password: password.value,
      factoryName: factoryName.value
    })
    emit("logged-in")
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Registration failed"
  } finally {
    loading.value = false
  }
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

    @media (width <= 768px) {
      width: 90%;
    }
  }

  .tabs {
    @include flexRow(0, center);
    button {
      padding: 10px 30px;
      font-size: 1.2em;
      cursor: pointer;
      border: 2px solid var(--white);
      background: transparent;
      color: var(--white);
      transition: .3s;

      &.active {
        background: var(--white);
        color: var(--black);
      }
    }
  }

  label {
    width: 100%;
    @include flexColumn(4px, start, stretch);
    font-size: 0.9em;
    color: var(--white);
  }

  .form {
    width: 400px;
    @include flexColumn(10px, center);

    @media (width <= 768px) {
      width: 80%;
    }
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
    width: 100%;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .error {
    color: var(--error);
    font-size: 0.9em;
  }
}
</style>