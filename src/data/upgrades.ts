const BASE = import.meta.env.BASE_URL

export const UPGRADES = {
  clickingPower: {
    name: "Muscle Up!",
    description: "Increases click power",
    src: `${BASE}img/icons/hand-pointer.svg`,
    baseCost: 15,
    scale: 2.4,
    currency: "money",
    maxLevel: 10
  },
  sellMultiplier: {
    name: "Worthy Squares",
    description: "Squares make more IGM",
    src: `${BASE}img/icons/bx-dollar-circle.svg`,
    baseCost: 80,
    scale: 2.5,
    currency: "money"
  },
  creationSpeed: {
    name: "Hardware Acceleration",
    description: "Automatic creation is faster",
    src: `${BASE}img/icons/speedometer.svg`,
    baseCost: 50,
    scale: 2.2,
    currency: "money"
  },
  expGain: {
    name: "Learning Algorithm",
    description: "Patterns level up faster",
    src: `${BASE}img/icons/brain.svg`,
    baseCost: 60,
    scale: 2.0,
    currency: "money"
  },
  offlineCap: {
    name: "Not Connected",
    description: "Increases max offline earnings",
    src: `${BASE}img/icons/wifi-slash.svg`,
    baseCost: 40,
    scale: 1.8,
    currency: "money"
  },
  offlineGain: {
    name: "Autopilot",
    description: "Increases offline multiplier",
    src: `${BASE}img/icons/cpu.svg`,
    baseCost: 120,
    scale: 2.2,
    currency: "money"
  }
}

// DC upgrades — per pattern, speed + output, survive prestige (DC never resets)
export const DC_UPGRADES = {
  squareSpeed: {
    name: "Square Speed",
    description: "Squares are created faster",
    src: `${BASE}img/icons/Square Speed.svg`,
    baseCost: 50,
    scale: 2.0,
    currency: "dc",
    pattern: "square",
    stat: "speed"
  },
  squareOutput: {
    name: "Square Value",
    description: "Squares make more IGM",
    src: `${BASE}img/icons/Square Output.svg`,
    baseCost: 75,
    scale: 2.0,
    currency: "dc",
    pattern: "square",
    stat: "output"
  },
  triangleSpeed: {
    name: "Triangle Speed",
    description: "Triangles are created faster",
    src: `${BASE}img/icons/Triangle Speed.svg`,
    baseCost: 50,
    scale: 2.0,
    currency: "dc",
    pattern: "triangle",
    stat: "speed"
  },
  triangleOutput: {
    name: "Triangle Value",
    description: "Triangles produce more EXP",
    src: `${BASE}img/icons/Triangle Output.svg`,
    baseCost: 75,
    scale: 2.0,
    currency: "dc",
    pattern: "triangle",
    stat: "output"
  },
  crossSpeed: {
    name: "Cross Speed",
    description: "Crosses are created faster",
    src: `${BASE}img/icons/Cross Speed.svg`,
    baseCost: 50,
    scale: 2.0,
    currency: "dc",
    pattern: "cross",
    stat: "speed"
  },
  crossOutput: {
    name: "Cross Value",
    description: "Crosses produce more PP",
    src: `${BASE}img/icons/Cross Output.svg`,
    baseCost: 75,
    scale: 2.0,
    currency: "dc",
    pattern: "cross",
    stat: "output"
  }
}

// Prestige upgrades — survive reset, bought with PP
export const PRESTIGE_UPGRADES = {
  prestigeOutput: {
    name: "Reinforced Production",
    description: "Permanently increases all slot output by 15%",
    src: `${BASE}img/icons/diamond.svg`,
    baseCost: 1,
    scale: 2.5,
    currency: "prestige"
  },
  prestigeSpeed: {
    name: "Eternal Momentum",
    description: "Permanently increases all slot speed by 10%",
    src: `${BASE}img/icons/hourglass-half-solid.svg`,
    baseCost: 2,
    scale: 2.5,
    currency: "prestige"
  },
  prestigeClick: {
    name: "Iron Will",
    description: "Permanently increases click power by 20%",
    src: `${BASE}img/icons/heart.svg`,
    baseCost: 1,
    scale: 3.0,
    currency: "prestige"
  }
}