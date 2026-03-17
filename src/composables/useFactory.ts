import { ref, type Ref } from "vue"
import type { Part } from "@/types/Part"
import type { Machine } from "@/types/Machine"
import { useSaveSystem } from "./useSaveSystem"
import { gameStore } from '@/stores/useGameStore'

const { saveGame } = useSaveSystem()

export function useFactory(
  gainExp: (amount: number) => void,
  colors: Record<string, string>
) {
  const parts = ref<Part[]>([])
  const creatingProgress = ref(0)
  const speedController = 20
  const MAX_DELTA = 0.2

  type Point = { x: number; y: number }
  const conveyorPath: Point[] = [{ x: 0, y: 120 }, { x: 0, y: 500 }]

  const machines: Machine[] = [
    {
      id: "color",
      description: "Color Machine",
      at: 0.3,
      price: 50,
      owned: false,
      src: "@assets/machines/ColorMachine.png",
      apply(part) {
        return { ...part, traits: { ...part.traits, color: gameStore.currentPattern.value?.traits.color } }
      }
    },
    {
      id: "cut",
      description: "Cutting Machine",
      at: 0.65,
      price: 25000,
      owned: false,
      src: "@assets/machines/CutMachine.png",
      apply(part) {
        return { ...part, traits: { ...part.traits, cut: gameStore.currentPattern.value?.traits.shape } }
      }
    }
  ]

  let partId = 0
  function spawnPart() {
    parts.value.push({
      id: partId++,
      patternId: gameStore.currentPattern.value.id,
      progress: 0,
      speed: 0.01,
      traits: { color: colors.gray, cut: "circle" }
    })
  }

  function click() {
    creatingProgress.value += gameStore.upgrades.clickingPower?.power
    if (creatingProgress.value >= gameStore.currentPattern.value.creationTime) {
      spawnPart()
      creatingProgress.value = 0
    }
  }

  function getPositionOnPath(path: Point[], progress: number) {
    const segments = path.length - 1
    const segProgress = progress * segments
    const index = Math.floor(segProgress)
    const t = segProgress - index
    const p1 = path[index]
    const p2 = path[index + 1] ?? p1
    return { x: p1!.x + (p2!.x - p1!.x) * t, y: p1!.y + (p2!.y - p1!.y) * t }
  }

  function partStyle(part: Part) {
    const pos = getPositionOnPath(conveyorPath, part.progress)
    return { transform: `translate(${pos.x}px, ${pos.y}px)`, fill: part.traits.color || colors.gray }
  }

  function machinePos(machine: Machine) {
    const pos = getPositionOnPath(conveyorPath, machine.at)
    return { transform: `translate(${pos.x}px, ${pos.y}px)` }
  }

  function calculateValue(part: Part) {
    return part.patternId === gameStore.dailyPattern.value.id
      ? gameStore.dailyPattern.value.baseValue * gameStore.upgrades.sellMultiplier.power * prestigeMultiplier.value
      : gameStore.currentPattern.value.baseValue * gameStore.upgrades.sellMultiplier.power * prestigeMultiplier.value
  }

  function calculateExp(part: Part) {
    return gameStore.currentPattern.value?.baseExp
  }

  function isPartComplete(part: Part) {
    const reqs = gameStore.currentPattern.value.requirements
    return Object.entries(reqs).every(([key, needed]) => !needed || (part.traits as any)[key])
  }

  function sellPart(part: Part) {
    if (!isPartComplete(part)) {
      gameStore.money.value += Math.floor(calculateValue(part) * 0.3)
    } else {
      gameStore.money.value += calculateValue(part)
      if (part.patternId === gameStore.dailyPattern.value.id) gameStore.dc.value += 10
    }
    gameStore.partsSold.value += 1
    gainExp(calculateExp(part)!)
    saveGame()
  }

  function startFactoryLoop() {
    let lastTime = Date.now()

    setInterval(() => {
      const now = Date.now()
      let deltaSeconds = (now - lastTime) / 1000
      lastTime = now
      deltaSeconds = Math.min(deltaSeconds, MAX_DELTA)
      creatingProgress.value += gameStore.upgrades.creationSpeed.power * gameStore.prestigeMultiplier.value * deltaSeconds * speedController

      while (creatingProgress.value >= gameStore.currentPattern.value.creationTime) {
        spawnPart()
        creatingProgress.value -= gameStore.currentPattern.value.creationTime
      }

      parts.value.forEach((part, index) => {
        part.progress += part.speed * deltaSeconds * speedController
        machines.forEach(machine => {
          if (machine.owned && part.progress >= machine.at && !(part as any)[`machine_${machine.at}`]) {
            Object.assign(part, machine.apply(part))
            ;(part as any)[`machine_${machine.at}`] = true
          }
        })
        if (part.progress >= 1) {
          sellPart(part)
          parts.value.splice(index, 1)
        }
      })
    }, 50)
  }

  return { machines, parts, creatingProgress, spawnPart, click, startFactoryLoop, machinePos, partStyle }
}