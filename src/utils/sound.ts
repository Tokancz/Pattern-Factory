import { ref, watch } from "vue"

export type SoundName = "click" | "error" | "magic" | "pop" | "buy" | "tabClick"
export type LoopTrack = 1 | 2 | 3

const BASE = import.meta.env.BASE_URL

function makeAudio(file: string, volume: number): HTMLAudioElement {
  const a = new Audio(`${BASE}sound/${file}`)
  a.volume = volume
  return a
}

const sounds: Record<SoundName, HTMLAudioElement> = {
  click:    makeAudio("click.wav",    0.5),
  error:    makeAudio("error.wav",    0.6),
  magic:    makeAudio("magic.wav",    0.7),
  pop:      makeAudio("pop.wav",      0.5),
  buy:      makeAudio("buy.wav",      0.55),
  tabClick: makeAudio("tabClick.wav", 0.4),
}

// Background loop tracks — selectable via setLoopTrack()
const loopTracks: Record<LoopTrack, HTMLAudioElement> = {
  1: makeAudio("loop.wav",  0.15),
  2: makeAudio("loop2.wav", 0.15),
  3: makeAudio("loop3.wav", 0.15),
}
for (const a of Object.values(loopTracks)) a.loop = true

const storedTrack = Number(localStorage.getItem("loopTrack") ?? "1") as LoopTrack
const currentTrack = ref<LoopTrack>(loopTracks[storedTrack] ? storedTrack : 1)
let loop: HTMLAudioElement = loopTracks[currentTrack.value]

// Boost layer — plays on top of the BG loop while targeted overclock is active.
const boost = makeAudio("boost.wav", 0.25)
boost.loop = true
let boostWanted = false

// Default: muted. Persisted in localStorage so the user's choice sticks.
const muted = ref(localStorage.getItem("muted") !== "false")

watch(muted, v => {
  localStorage.setItem("muted", String(v))
  if (v) {
    loop.pause()
    boost.pause()
  } else {
    loop.play().catch(() => {})
    if (boostWanted) boost.play().catch(() => {})
  }
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

export function setBoostActive(active: boolean): void {
  boostWanted = active
  if (active && !muted.value) {
    boost.play().catch(() => {})
  } else {
    boost.pause()
    boost.currentTime = 0
  }
}

export function setLoopTrack(track: LoopTrack): void {
  const next = loopTracks[track]
  if (!next || next === loop) return
  const wasPlaying = !loop.paused
  loop.pause()
  loop.currentTime = 0
  loop = next
  currentTrack.value = track
  localStorage.setItem("loopTrack", String(track))
  if ((wasPlaying || !muted.value) && !muted.value) loop.play().catch(() => {})
}

export function cycleLoopTrack(dir: 1 | -1): void {
  const tracks: LoopTrack[] = [1, 2, 3]
  const idx = tracks.indexOf(currentTrack.value)
  const next = tracks[(idx + dir + tracks.length) % tracks.length] as LoopTrack
  setLoopTrack(next)
}

export function useLoopTrack() {
  return currentTrack
}

export function toggleMute(): void {
  muted.value = !muted.value
}

export function useMuted() {
  return muted
}
