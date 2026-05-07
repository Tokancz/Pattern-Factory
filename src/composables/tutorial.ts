import { ref } from "vue"

// Shared tutorial-visibility state. Module-level ref acts as a tiny
// singleton so any component can open the tutorial (used by IntroOverlay's
// "Open Tutorial" button to trigger Simulation.vue's overlay).
export const tutorialVisible = ref(false)

export function openTutorial() { tutorialVisible.value = true }
export function closeTutorial() { tutorialVisible.value = false }
