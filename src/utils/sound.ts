export function playSound(name: string) {
  const audio = new Audio(`/sounds/${name}.mp3`)
  audio.volume = 0.3
  audio.play()
}