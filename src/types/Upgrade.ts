export type Upgrade = {
  key: string
  id: string
  lvl: number
  value: number       // cost for next level
  power: number       // effect of upgrade
  baseValue?: number  // starting value for effect calculation
  baseCost?: number   // starting value for cost calculation
  valueScale?: number // scaling for cost (default 1.6)
  powerScale?: number // scaling for effect (default 1.15)
}

export type Upgrades = {
  clickingPower: Upgrade
  creationSpeed: Upgrade
  sellMultiplier: Upgrade
  offlineCap: Upgrade
  offlineMultiplier: Upgrade
}