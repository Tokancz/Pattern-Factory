export type Upgrade = {
  key: keyof Upgrades
  id: string
  lvl: number
  value: number
  power: number
}
export type Upgrades = {
  clickingPower: Upgrade
  creationSpeed: Upgrade
  sellMultiplier: Upgrade
}