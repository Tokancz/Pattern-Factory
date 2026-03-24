const BASE = import.meta.env.BASE_URL

export const MACHINES = {
  slotUnlock: {
    name: "Scale-Out",
    description: "Unlocks a new pattern slot",
    src: `${BASE}img/icons/server-plus.svg`,
    baseCost: 100,
    scale: 10,

    type: "unlockSlot"
  },

  slotBoost: {
    name: "Overclock",
    description: "Boosts all slot speed",
    src: `${BASE}img/icons/flame.svg`,
    baseCost: 200,
    scale: 6,

    type: "globalSpeed",
    value: 1.2
  },

  targetedBoost: {
    name: "Advanced Engineering",
    description: "Boosts selected slot (Shift + click)",
    src: `${BASE}img/icons/flask-outline.svg`,
    baseCost: 300,
    scale: 2.5,

    type: "targetedBoost",
    value: 1.5
  },

  outputBoost: {
    name: "Industrial Press",
    description: "Increases all output",
    src: `${BASE}img/icons/factory-building.svg`,
    baseCost: 500,
    scale: 4,
    type: "globalOutput",
    value: 1.15
  },

  expMachine: {
    name: "Neural Trainer",
    description: "Patterns gain more EXP",
    src: `${BASE}img/icons/bx-git-repo-forked.svg`,
    baseCost: 400,
    scale: 4.5,
    type: "expBoost",
    value: 1.2
  }
}