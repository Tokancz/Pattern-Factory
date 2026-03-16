<template>
    <div class="pattern">
        <p>{{ machine.description }}</p>

        <img :src="machine.src">

        <button v-if="!machine.owned" @click="$emit('buy', machine)">
            Price: {{ formatNumber(machine.price) }} IGM
        </button>
        <button v-else>Owned</button>
    </div>
</template>

<script setup lang="ts">

defineProps({
  machine: Object,
  formatNumber: Function
})

defineEmits(["buy"])

</script>