import { ref, watch } from "vue"

export type SoundName = "click" | "error" | "magic" | "pop"

const BASE = import.meta.env.BASE_URL

function makeAudio(file: string, volume: number): HTMLAudioElement {
  const a = new Audio(`${BASE}sound/${file}`)
  a.volume = volume
  return a
}

const sounds: Record<SoundName, HTMLAudioElement> = {
  click: makeAudio("click.wav", 0.5),
  error: makeAudio("error.wav", 0.6),
  magic: makeAudio("magic.wav", 0.7),
  pop:   makeAudio("pop.wav",   0.5),
}

const loop = makeAudio("loop.wav", 0.15)
loop.loop = true

// Default: unmuted. Persisted in localStorage so the user's choice sticks.
const muted = ref(localStorage.getItem("muted") === "true")

watch(muted, v => {
  localStorage.setItem("muted", String(v))
  if (v) loop.pause()
  else   loop.play().catch(() => {})
})

export function playSound(name: SoundName): void {
  if (muted.value) return
  // Kick off the background loop on the first audible event.
  // Browsers block autoplay until a user gesture — this piggy-backs on one.
  if (loop.paused) loop.play().catch(() => {})

  const template = sounds[name]
  const clone = template.cloneNode() as HTMLAudioElement
  clone.volume = template.volume
  clone.play().catch(() => {})
}

export function toggleMute(): void {
  muted.value = !muted.value
}

export function useMuted() {
  return muted
}
