export type PartTraits = {
  color?: string
  cut?: string
  merged?: boolean
  shape: string // <- required now
}

export type Part = {
  id: number
  patternId: string
  progress: number
  speed: number
  traits: PartTraits
}