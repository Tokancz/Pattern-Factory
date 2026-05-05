<template>
  <nav class="nav" aria-label="Main navigation">
    <div class="nav__group">▸ Play</div>
    <router-link to="/" class="nav__item" :class="{ 'is-active': route.path === '/' }">
      <img class="nav__item__icon" src="/img/icons/factory-building.svg" alt="">
      <span class="nav__item__label">Factory</span>
      <span class="nav__item__meta">●</span>
    </router-link>
    <router-link to="/patterns" class="nav__item">
      <img class="nav__item__icon" src="/img/icons/connectdevelop.svg" alt="">
      <span class="nav__item__label">Patterns</span>
      <span class="nav__item__meta">{{ patterns.unlockedPatterns.length }}/4</span>
    </router-link>
    <router-link to="/upgrades" class="nav__item">
      <img class="nav__item__icon" src="/img/icons/cpu.svg" alt="">
      <span class="nav__item__label">Upgrades</span>
      <span class="nav__item__meta"></span>
    </router-link>

    <div class="nav__group">▸ Progress</div>
    <router-link to="/synergies" class="nav__item">
      <img class="nav__item__icon" src="/img/icons/bx-git-repo-forked.svg" alt="">
      <span class="nav__item__label">Synergies</span>
      <span v-if="activeSynergyCount > 0" class="nav__item__badge">{{ activeSynergyCount }}</span>
      <span v-else class="nav__item__meta"></span>
    </router-link>
    <router-link to="/machines" class="nav__item">
      <img class="nav__item__icon" src="/img/icons/server-plus.svg" alt="">
      <span class="nav__item__label">Machines</span>
      <span class="nav__item__meta"></span>
    </router-link>
    <router-link to="/inventory" class="nav__item">
      <img class="nav__item__icon" src="/img/icons/diamond.svg" alt="">
      <span class="nav__item__label">Inventory</span>
      <span class="nav__item__meta"></span>
    </router-link>

    <div class="nav__group">▸ Meta</div>
    <router-link to="/prestige" class="nav__item" :class="{ 'is-muted': !game.canPrestige }">
      <img class="nav__item__icon" src="/img/icons/brain.svg" alt="">
      <span class="nav__item__label">Prestige</span>
      <span class="nav__item__meta">{{ game.canPrestige ? "●" : "—" }}</span>
    </router-link>
    <router-link to="/leaderboard" class="nav__item">
      <img class="nav__item__icon" src="/img/icons/hubspot.svg" alt="">
      <span class="nav__item__label">Ranking</span>
      <span class="nav__item__meta"></span>
    </router-link>

    <div class="tutorial">
      <div class="tutorial__head">
        <span class="tutorial__step">▸ TUTORIAL</span>
        <span class="tutorial__counter">— / 7</span>
      </div>
      <div class="tutorial__title">Pattern Factory.</div>
      <div class="tutorial__actions">
        <button class="tutorial__btn" @click="openTutorial">Open</button>
      </div>
    </div>
  </nav>

  <TutorialOverlay v-model="tutorialVisible" :steps="tutorialSteps" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue"
import { useRoute } from "vue-router"
import { usePatternStore } from "@/stores/pattern"
import { useGameStore } from "@/stores/game"
import { useSynergyStore } from "@/stores/synergy"
import TutorialOverlay from "@/components/ui/TutorialOverlay.vue"
import { TUTORIAL_STEPS } from "@/data/tutorial"

const route = useRoute()
const patterns = usePatternStore()
const game = useGameStore()
const synergy = useSynergyStore()

const tutorialVisible = ref(false)
const tutorialSteps = TUTORIAL_STEPS

const activeSynergyCount = computed(() => synergy.activeSynergies.length)

function openTutorial() { tutorialVisible.value = true }
</script>

<style scoped lang="scss">
.nav {
  grid-area: nav;
  border-right: 1px solid $border;
  background: rgba($surface, .35);
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.nav__group {
  padding: $s-4 $s-3 $s-2;
  @include label(10px);
}

.nav__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: $s-3;
  padding: 10px $s-4;
  margin: 2px $s-2;
  border-radius: $r-sm;
  color: $ink-2;
  cursor: pointer;
  user-select: none;
  text-decoration: none;
  transition: background .15s $ease, color .15s $ease;

  &::before {
    content: "";
    position: absolute;
    left: -2px; top: 25%; bottom: 25%;
    width: 2px;
    background: transparent;
    border-radius: $r-pill;
    transition: background .15s $ease;
  }

  &__icon {
    width: 16px; height: 16px;
    flex-shrink: 0;
    opacity: .65;
    filter: invert(85%) sepia(11%) saturate(220%) hue-rotate(190deg) brightness(95%);
  }
  &__label {
    flex: 1;
    font-family: $ff-ui;
    font-weight: 500;
    font-size: 14px;
  }
  &__meta {
    font-family: $ff-mono;
    font-weight: 600;
    font-size: 11px;
    color: $ink-3;
    @include tab-nums;
  }
  &__badge {
    @include chip($danger, rgba($danger, .15));
    font-size: 9px;
    padding: 1px 6px;
  }

  &:hover {
    background: rgba($accent, .06);
    color: $ink;
    .nav__item__icon { opacity: 1; }
  }
  &.is-active,
  &.router-link-exact-active {
    background: linear-gradient(90deg, rgba($accent, .12) 0%, rgba($accent, .04) 100%);
    color: $ink;
    &::before { background: $accent; box-shadow: 0 0 8px rgba($accent, .8); }
    .nav__item__icon { opacity: 1; filter: invert(80%) sepia(80%) saturate(2000%) hue-rotate(140deg); }
    .nav__item__meta { color: $accent; }
  }
  &.is-muted {
    color: $ink-4;
    .nav__item__icon { opacity: .35; }
  }
}

.tutorial {
  margin-top: auto;
  padding: $s-4;
  border-top: 1px solid $border;
  display: flex;
  flex-direction: column;
  gap: $s-3;

  &__head {
    display: flex;
    align-items: center;
    gap: $s-2;
  }
  &__step { @include label(10px, $accent); }
  &__counter {
    @include label(10px, $ink-3);
    margin-left: auto;
  }
  &__title {
    font-family: $ff-display;
    font-weight: 600;
    font-size: 16px;
    color: $ink;
    line-height: 1.25;
  }
  &__actions {
    display: flex;
    gap: $s-2;
  }
  &__btn {
    flex: 1;
    @include btn-primary;
    padding: 7px 10px;
    font-size: 10px;
  }
}
</style>
