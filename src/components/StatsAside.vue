<template>
    <aside id="stats">
      <section>
        <h3>Stats</h3>
        <p>Income: {{ props.incomePerSecond }} IGM/s</p>
        <p>Idle: {{ props.idleIncomePerSecond }} IGM/s</p>
        <p>Parts Sold: {{ formatNumber(partsSold) }}</p>
        <p>Prestige Bonus: {{ prestigeMultiplier }} *</p>
      </section>
      <section>
        <h3>Progress</h3>
        <p>Next Part: {{ currentPattern ? Math.floor(creatingProgress! / currentPattern.creationTime * 100) : 0 }} %</p>
        <input type="range" min="0" :max="currentPattern?.creationTime ?? 1" class="slider" :value="creatingProgress" disabled>
        <p>Initial Price: {{ formatNumber(currentPattern?.baseValue ?? 0) }} IGM</p>
        <p>Current Price: {{ displayValue!(currentPattern) }} IGM</p>
      </section>
      <section>
        <h3>Daily Pattern</h3>
        <p>1.5x multiplier !!</p>
        <p>Price: {{ displayValue!(dailyPattern) }} IGM</p>
        <p>DC: 10 DC</p>
        <svg v-if="dailyPattern?.traits"
             viewBox="0 0 32 32"
             :style="{ fill: dailyPattern.traits.color }"
             v-html="shapes![dailyPattern.traits.shape]">
        </svg>
      </section>
    </aside>
</template>

<script setup lang="ts">

    import { gameStore } from '@/stores/useGameStore';
    import { useGameState } from '@/composables/useGameState';

    const props = defineProps({
        creatingProgress: Number,
        incomePerSecond: String,
        idleIncomePerSecond: String,
        currentPattern: Object,
        displayValue: Function,
        shapes: Object
    })

    const { formatNumber } = useGameState()

    const { currentPattern, dailyPattern, partsSold, prestigeMultiplier } = gameStore

</script>

<style lang="scss">
aside#stats {
    @include flexColumn(20px, center, start);
    padding: 20px;
    width: var(--asideWidth);
    height: 100%;

    section {
    width: 100%;
    @include flexColumn(5px);
    background-color: var(--primary75);
    padding: 20px;
    color: var(--darkgray);
    text-align: start;
    border: var(--primary) 3px solid;

    h3 {
        width: 100%;
        font-size: 2em;
    }
    p {
        width: 100%;
        font-size: 1.3em;
        color: var(--lightgray);
    }
    svg {
        width: 100px;
        user-select: none;
    }
    .slider {
        width: 100%;
        height: 10px;
        accent-color: var(--primary);
    }
    }
}
</style>