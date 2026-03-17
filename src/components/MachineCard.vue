<template>
    <div class="pattern">
        <p>{{ props.machine.description }}</p>

        <img :src="props.machine.src">

        <button v-if="!props.machine.owned" @click="$emit('buy', props.machine)">
            Price: {{ props.formatNumber(props.machine.price) }} IGM
        </button>
        <button v-else>Owned</button>
    </div>
</template>

<script setup lang="ts">
import type { Machine } from "@/types/Machine"

const props = defineProps<{
  machine: Machine
  formatNumber: (num: number) => string
}>()

console.log(props.machine)

defineEmits(["buy"])

</script>