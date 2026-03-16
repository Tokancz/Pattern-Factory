import type { Part } from "./Part"

export type Machine = {
  id: string
  description?: string
  at: number
  price: number
  owned: boolean
  src: string
  apply(part: Part): Part
}