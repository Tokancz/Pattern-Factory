import { ref, watch } from "vue"

export type SoundName = "click" | "error" | "magic" | "pop" | "buy" | "tabClick" | "hit" | "victory" | "defeat"
export type LoopTrack = 1 | 2 | 3 | 4 | 5

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
  hit:      makeAudio("hit.wav",      0.6),
  victory:  makeAudio("victory.mp3",  0.7),
  defeat:   makeAudio("defeat.mp3",   0.7),
}

// Background loop tracks — selectable via setLoopTrack()
const loopTracks: Record<LoopTrack, HTMLAudioElement> = {
  1: makeAudio("loop.wav",  0.15),
  2: makeAudio("loop2.wav", 0.15),
  3: makeAudio("loop3.wav", 0.15),
  4: makeAudio("loop4.wav", 0.15),
  5: makeAudio("loop5.wav", 0.15),
}
for (const a of Object.values(loopTracks)) a.loop = true

// Boss loops — one is picked at random when a boss fight starts; replaces the BG loop while active.
const bossLoops: HTMLAudioElement[] = [
  makeAudio("bossloop.wav",  0.2),
  makeAudio("bossloop2.wav", 0.2),
  makeAudio("bossloop3.wav", 0.2),
  makeAudio("bossloop4.wav", 0.2),
  makeAudio("bossloop5.wav", 0.2),
]
for (const a of bossLoops) a.loop = true
let activeBossLoop: HTMLAudioElement | null = null

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
    activeBossLoop?.pause()
  } else {
    if (activeBossLoop) activeBossLoop.play().catch(() => {})
    else loop.play().catch(() => {})
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

export function startBossLoop(): void {
  const pick = bossLoops[Math.floor(Math.random() * bossLoops.length)]!
  if (activeBossLoop && activeBossLoop !== pick) {
    activeBossLoop.pause()
    activeBossLoop.currentTime = 0
  }
  activeBossLoop = pick
  loop.pause()
  if (!muted.value) pick.play().catch(() => {})
}

export function stopBossLoop(): void {
  if (activeBossLoop) {
    activeBossLoop.pause()
    activeBossLoop.currentTime = 0
    activeBossLoop = null
  }
  if (!muted.value) loop.play().catch(() => {})
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
  loop.pause()
  loop.currentTime = 0
  loop = next
  currentTrack.value = track
  localStorage.setItem("loopTrack", String(track))
  if (!muted.value && !activeBossLoop) loop.play().catch(() => {})
}

export function cycleLoopTrack(dir: 1 | -1): void {
  const tracks: LoopTrack[] = [1, 2, 3, 4, 5]
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
