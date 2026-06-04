import { ref, watch } from "vue"

export type SoundName = "click" | "error" | "magic" | "pop" | "buy" | "tabClick" | "hit" | "victory" | "defeat" | "countdown" | "fight"
export type LoopTrack = 1 | 2 | 3 | 4 | 5

const BASE = import.meta.env.BASE_URL

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function loadVolume(key: string, fallback: number): number {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  const n = Number(raw)
  return isNaN(n) ? fallback : clamp01(n)
}

// Two independent category sliders, persisted. The per-sound numbers below
// are *design* volumes (the relative mix between sounds); the category
// volume scales that mix so the player can dial each group up or down.
const musicVolume = ref(loadVolume("musicVolume", 1))
const sfxVolume   = ref(loadVolume("sfxVolume", 1))

// Every long-lived music element + its design volume, so a music-volume
// change can re-apply `base * musicVolume` to all of them at once.
const musicEls: { el: HTMLAudioElement; base: number }[] = []

function makeMusic(file: string, base: number): HTMLAudioElement {
  const a = new Audio(`${BASE}sound/${file}`)
  a.volume = clamp01(base * musicVolume.value)
  musicEls.push({ el: a, base })
  return a
}

function makeSfx(file: string): HTMLAudioElement {
  // SFX are templates that get cloned per play; the clone's volume is set
  // at play time from SFX_BASE * sfxVolume, so the template volume is moot.
  return new Audio(`${BASE}sound/${file}`)
}

// Design volumes for one-shot effects.
const SFX_BASE: Record<SoundName, number> = {
  click:     0.5,
  error:     0.6,
  magic:     0.7,
  pop:       0.5,
  buy:       0.55,
  tabClick:  0.4,
  hit:       0.6,
  victory:   0.7,
  defeat:    0.7,
  countdown: 0.7,
  fight:     0.7,
}

const sounds: Record<SoundName, HTMLAudioElement> = {
  click:     makeSfx("click.wav"),
  error:     makeSfx("error.wav"),
  magic:     makeSfx("magic.wav"),
  pop:       makeSfx("pop.wav"),
  buy:       makeSfx("buy.wav"),
  tabClick:  makeSfx("tabClick.wav"),
  hit:       makeSfx("hit.wav"),
  victory:   makeSfx("victory.mp3"),
  defeat:    makeSfx("defeat.mp3"),
  countdown: makeSfx("countdown.wav"),
  fight:     makeSfx("fight.wav"),
}

// Background loop tracks — selectable via setLoopTrack()
const loopTracks: Record<LoopTrack, HTMLAudioElement> = {
  1: makeMusic("loop.wav",  0.15),
  2: makeMusic("loop2.wav", 0.15),
  3: makeMusic("loop3.wav", 0.15),
  4: makeMusic("loop4.wav", 0.15),
  5: makeMusic("loop5.wav", 0.15),
}
for (const a of Object.values(loopTracks)) a.loop = true

// Boss loops — one is picked at random when a boss fight starts; replaces the BG loop while active.
const bossLoops: HTMLAudioElement[] = [
  makeMusic("bossloop.wav",  0.2),
  makeMusic("bossloop2.wav", 0.2),
  makeMusic("bossloop3.wav", 0.2),
  makeMusic("bossloop4.wav", 0.2),
  makeMusic("bossloop5.wav", 0.2),
]
for (const a of bossLoops) a.loop = true
let activeBossLoop: HTMLAudioElement | null = null

const storedTrack = Number(localStorage.getItem("loopTrack") ?? "1") as LoopTrack
const currentTrack = ref<LoopTrack>(loopTracks[storedTrack] ? storedTrack : 1)
let loop: HTMLAudioElement = loopTracks[currentTrack.value]

// Boost layer — plays on top of the BG loop while targeted overclock is active.
const boost = makeMusic("boost.wav", 0.25)
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
  } else if (activeBossLoop) {
    // Boss loop owns audio while it's active — keep BG and boost silent.
    activeBossLoop.play().catch(() => {})
  } else {
    loop.play().catch(() => {})
    if (boostWanted) boost.play().catch(() => {})
  }
})

// Re-mix every live music element when the music slider moves.
watch(musicVolume, v => {
  localStorage.setItem("musicVolume", String(v))
  for (const { el, base } of musicEls) el.volume = clamp01(base * v)
})

// SFX volume is applied per-clone at play time; just persist on change.
watch(sfxVolume, v => {
  localStorage.setItem("sfxVolume", String(v))
})

export interface PlaySoundOptions {
  // Multiplier on playback rate. Doubles as pitch since we don't
  // preserve pitch — passing 1.1 plays back ~a whole step higher.
  rate?: number
}

export function playSound(name: SoundName, opts?: PlaySoundOptions): void {
  if (muted.value) return
  if (sfxVolume.value <= 0) return
  // Kick off the background loop on the first audible event.
  // Browsers block autoplay until a user gesture — this piggy-backs on one.
  // Skip while a boss loop owns the audio, otherwise hits/countdown sounds
  // would restart the BG loop on top of the boss music.
  if (loop.paused && !activeBossLoop) loop.play().catch(() => {})

  const template = sounds[name]
  const clone = template.cloneNode() as HTMLAudioElement
  clone.volume = clamp01(SFX_BASE[name] * sfxVolume.value)
  if (opts?.rate && opts.rate > 0) clone.playbackRate = opts.rate
  clone.play().catch(() => {})
}

export function startBossLoop(): void {
  const pick = bossLoops[Math.floor(Math.random() * bossLoops.length)]!
  if (activeBossLoop && activeBossLoop !== pick) {
    activeBossLoop.pause()
    activeBossLoop.currentTime = 0
  }
  activeBossLoop = pick
  // Silence BG + boost while the boss loop owns the audio.
  loop.pause()
  boost.pause()
  if (!muted.value) pick.play().catch(() => {})
}

export function stopBossLoop(): void {
  if (activeBossLoop) {
    activeBossLoop.pause()
    activeBossLoop.currentTime = 0
    activeBossLoop = null
  }
  if (!muted.value) {
    loop.play().catch(() => {})
    if (boostWanted) boost.play().catch(() => {})
  }
}

export function setBoostActive(active: boolean): void {
  boostWanted = active
  // Boss loop suppresses boost — start it back up via stopBossLoop().
  if (active && !muted.value && !activeBossLoop) {
    boost.play().catch(() => {})
  } else if (!active) {
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

// ─── Category volume controls (used by the Settings panel) ─────────────────
export function useMusicVolume() {
  return musicVolume
}

export function useSfxVolume() {
  return sfxVolume
}

export function setMusicVolume(v: number): void {
  musicVolume.value = clamp01(v)
}

export function setSfxVolume(v: number): void {
  sfxVolume.value = clamp01(v)
}
