import { useSlotStore } from "@/stores/slot"
import { useAchievementStore } from "@/stores/achievement"

// How often to re-evaluate achievement conditions (seconds). Once a second is
// plenty for milestone checks and keeps the per-frame loop cheap.
const ACHIEVEMENT_CHECK_INTERVAL = 1

export function startGameLoop() {
  const slots = useSlotStore()
  const achievements = useAchievementStore()

  let last = performance.now()
  let sinceAchievementCheck = 0

  function loop(now: number) {
    const delta = (now - last) / 1000
    last = now

    slots.tick(delta)

    sinceAchievementCheck += delta
    if (sinceAchievementCheck >= ACHIEVEMENT_CHECK_INTERVAL) {
      sinceAchievementCheck = 0
      achievements.check()
    }

    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
}
