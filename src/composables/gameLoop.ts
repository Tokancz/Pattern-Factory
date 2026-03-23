import { useSlotStore } from "@/stores/slot"

export function startGameLoop() {
  const slots = useSlotStore()

  let last = performance.now()

  function loop(now: number) {
    const delta = (now - last) / 1000
    last = now

    slots.tick(delta)

    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
}