<template>
<footer>
    <img src="/img/Footer.png" alt="Footer" draggable="false">
    <p id="money">Money: {{ money }} IGM</p>
    <p id="dc">DC: {{ dc }}</p>
</footer>
</template>

<script setup lang="ts">
    const props = defineProps({
        money: String,
        dc: String,
    })
</script>
