import { ref, watch } from "vue"

// ─── Animations toggle ─────────────────────────────────────────────────────
// Persisted preference. When off, a global `.anims-off` class on <html>
// neutralizes CSS transitions/animations (see main.scss). Defaults to on,
// but respects the OS "reduce motion" setting on a fresh visit.
function initialAnimations(): boolean {
  const stored = localStorage.getItem("animationsEnabled")
  if (stored !== null) return stored !== "false"
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  return !prefersReduced
}

const animationsEnabled = ref(initialAnimations())

function applyAnimationClass(enabled: boolean): void {
  document.documentElement.classList.toggle("anims-off", !enabled)
}

// Apply immediately on module load so the class is correct before first paint.
applyAnimationClass(animationsEnabled.value)

watch(animationsEnabled, v => {
  localStorage.setItem("animationsEnabled", String(v))
  applyAnimationClass(v)
})

export function useAnimationsEnabled() {
  return animationsEnabled
}

export function toggleAnimations(): void {
  animationsEnabled.value = !animationsEnabled.value
}

// ─── Settings panel visibility ─────────────────────────────────────────────
// Module-level singleton (mirrors composables/tutorial.ts) so any component
// can open the panel and a single overlay instance reacts to it.
const settingsOpen = ref(false)

export function useSettingsOpen() {
  return settingsOpen
}

export function openSettings(): void {
  settingsOpen.value = true
}

export function closeSettings(): void {
  settingsOpen.value = false
}
