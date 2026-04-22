const BASE = import.meta.env.BASE_URL

export const MACHINES = {
  slotUnlock: {
    name: "Scale-Out",
    description: "Unlocks a new pattern slot",
    src: `${BASE}img/icons/server-plus.svg`,
    baseCost: 200,
    scale: 15,
    type: "unlockSlot"
  },

  slotBoost: {
    name: "Advanced Engineering",
    description: "Boosts all slot speed by 25%",
    src: `${BASE}img/icons/flask-outline.svg`,
    baseCost: 500,
    scale: 8,
    type: "globalSpeed",
    value: 1.25
  },

  targetedBoost: {
    name: "Overclock",
    description: "Boosts slot speed by 75% (Shift + click to select)",
    src: `${BASE}img/icons/flame.svg`,
    baseCost: 800,
    scale: 4,
    type: "targetedBoost",
    value: 1.75
  },

  outputBoost: {
    name: "Industrial Press",
    description: "Increases all slot output by 20%",
    src: `${BASE}img/icons/factory-building.svg`,
    baseCost: 1200,
    scale: 5,
    type: "globalOutput",
    value: 1.2
  },

  expMachine: {
    name: "Neural Trainer",
    description: "Patterns gain 30% more EXP",
    src: `${BASE}img/icons/bx-git-repo-forked.svg`,
    baseCost: 600,
    scale: 5,
    type: "expBoost",
    value: 1.3
  },

  synergyBoost: {
    name: "Pattern Resonator",
    description: "Amplifies every active synergy's bonus by 15%",
    src: `${BASE}img/icons/hubspot.svg`,
    baseCost: 1500,
    scale: 6,
    type: "synergyAmp",
    value: 1.15
  }
}