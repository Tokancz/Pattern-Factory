<template>
  <div class="login">
    <h2>Welcome to Pattern Factory</h2>

    <div class="tabs">
      <button @click="mode = 'login'"    :class="{ active: mode === 'login' }">Login</button>
      <button @click="mode = 'register'" :class="{ active: mode === 'register' }">Register</button>
    </div>

    <div class="form">
      <template v-if="mode === 'login'">
        <input v-model="email" type="email" placeholder="Email"    />
        <input v-model="password" type="password" placeholder="Password" />
        <p v-if="error" class="error">{{ error }}</p>
        <button @click="handleLogin" :disabled="loading">
          {{ loading ? "Logging in..." : "Login" }}
        </button>
      </template>

      <template v-else>
        <input v-model="username" placeholder="Username" maxlength="15" />
        <input v-model="email" type="email" placeholder="Email" />
        <input v-model="password" type="password" placeholder="Password" />
        <input v-model="factoryName" placeholder="Factory Name" maxlength="15" />
        <p v-if="error" class="error">{{ error }}</p>
        <button @click="handleRegister" :disabled="loading">
          {{ loading ? "Registering..." : "Register" }}
        </button>
      </template>
    </div>
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
    color: #ff4444;
    font-size: 0.9em;
  }
}
</style>