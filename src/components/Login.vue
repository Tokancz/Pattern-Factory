<template>
  <div class="login">
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
