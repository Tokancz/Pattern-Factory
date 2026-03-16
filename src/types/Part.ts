export type PartTraits = {
  color?: string
  cut?: string
  merged?: boolean
}

export type Part = {
  id: number
  patternId: string
  progress: number
  speed: number
  traits: PartTraits
}