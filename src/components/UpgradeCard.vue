<template>
    <div class="upgrade">
        <p>{{ upgrade.id }} lvl: {{ upgrade.lvl }}</p>

        <p>Cost: {{ formatNumber(upgrade.value) }}</p>

        <button class="buy_button" @click="$emit('buy', upgrade)">
            Buy
        </button>
    </div>
</template>

<script setup lang="ts">

defineProps({
  upgrade: Object,
  formatNumber: Function
})

defineEmits(["buy"])

</script>