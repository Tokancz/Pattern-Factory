<template>
  <div class="card">

    <!-- PATTERNS + INVENTORY -->
    <template v-if="type === 'patterns' || type === 'inventory'">
      <svg
        viewBox="0 0 32 32"
        :style="{ fill: data.traits?.color || '#fff' }"
        v-html="shapes?.[data.traits?.shape || 'circle']"
      ></svg>

      <p>Value: {{ displayValue!(data) }}</p>
      <p>Exp: {{ formatNumber(data.baseExp) }}</p>
      <p>Time: {{ formatNumber(data.creationTime) }}</p>

      <!-- PATTERN SHOP -->
    <button
        v-if="type === 'patterns' && !gameStore.ownedPatterns.value.includes(data.id)"
        @click="$emit('buy', data)"
        >
        {{ formatNumber(data.price) }} IGM
    </button>

      <!-- INVENTORY -->
      <button
        v-if="type === 'inventory'"
        @click="$emit('select', data)"
      >
        {{ currentPattern?.id === data.id ? 'Selected' : 'Select' }}
      </button>
    </template>

    <!-- MACHINES -->
    <template v-else-if="type === 'machines'">
      <p>{{ data.description }}</p>

      <img :src="data.src" style="width: 80px" />

      <button
        v-if="!data.owned"
        @click="$emit('buy', data)"
      >
        {{ formatNumber(data.price) }} IGM
      </button>

      <button v-else>
        Owned
      </button>
    </template>

    <!-- UPGRADES -->
    <template v-else-if="type === 'upgrades'">
      <p>{{ data.id }} lvl: {{ data.lvl }}</p>
      <p>Cost: {{ formatNumber(data.value) }}</p>

      <button @click="$emit('buy', data.key)">
        Buy
      </button>
    </template>

    <!-- PRESTIGE -->
    <template v-else-if="type === 'prestige'">
      <p>Prestige Reward: {{ data.reward }}</p>

      <button @click="$emit('prestige')">
        Prestige
      </button>
    </template>

  </div>
</template>

<script setup lang="ts">
import { gameStore } from "@/stores/useGameStore"

const { currentPattern } = gameStore

defineProps<{
  type: 'patterns' | 'upgrades' | 'inventory' | 'prestige' | 'machines'
  data: any
  shapes?: Record<string, string>
  formatNumber: (n: number) => string
  displayValue?: (p: any) => string
}>()

defineEmits(['buy', 'select', 'prestige'])
</script>

<style lang="scss">
section.tab {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 60%;
    max-height: 80dvh;
    @include flexColumn(20px, start);
    background-color: var(--primary);
    z-index: 10;
    transform: translateX(-50%) translateY(-50%);
    padding: 20px;
    border-radius: 4px;

    div.shop_header {
    width: 100%;
    @include flexRow(0, space-between);

    h4 {
        font-size: 3em;
        @media (width <= 375px) {
        font-size: 2.5em;
        }
    }
    p {
        font-size: 3em;
        cursor: pointer;
    }
    }
    div.container {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        align-items: start;
        overflow-y: auto;
        gap: 20px;
        padding: 0 20px;

        @media (width <= 768px) {
            grid-template-columns: repeat(3, 1fr);
        }
        @media (width <= 425px) {
            grid-template-columns: repeat(2, 1fr);
            font-size: .9em;
            padding: 0px;
        }
        .card{
            width: 100%;
            @include flexColumn(10px, start);
            padding: 10px;
            border: var(--darkgray) 2px solid;
            border-radius: 8px;
            cursor: pointer;
            background-color: var(--gray);

            @media (width <= 425px) {
                gap: 5px;
            }

            svg {
                @media (width <= 768px) {
                    width: 80px;
                }
            }
            button {
                background: var(--lightgray);
                border: 2px solid var(--darkgray);
                border-radius: 8px;
                padding: 5px;
                cursor: pointer;
            }
            p {
                font-size: 1.3em;
                color: var(--white);
            }
        }
    }
    >p {
        width: 100%;
        color: var(--white);
        font-size: 2em;
    }
    >button {
        padding: 10px;
        border-radius: 8px;
        font-size: 2em;
    }
}
</style>