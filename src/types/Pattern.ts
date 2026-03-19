export type PatternRequirements = {
  color?: boolean
  cut?: boolean
  merged?: boolean
}

export type PatternTraits = {
  color: string
  shape: string
}

export type Pattern = {
  id: string
  baseValue: number
  baseExp: number
  creationTime: number
  price: number
  requirements: PatternRequirements
  traits: PatternTraits
}