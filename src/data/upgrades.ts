const BASE = import.meta.env.BASE_URL

export const UPGRADES = {
  clickingPower: {
    name: "Muscle Up!",
    description: "Increases click power (caps at level 10)",
    src: `${BASE}img/icons/hand-pointer.svg`,
    baseCost: 15,
    scale: 2.2,
    currency: "money",
    maxLevel: 10
  },
  sellMultiplier: {
    name: "Worthy Squares",
    description: "Sell patterns for more IGM",
    src: `${BASE}img/icons/bx-dollar-circle.svg`,
    baseCost: 80,
    scale: 2.5,
    currency: "money"
  },
  creationSpeed: {
    name: "Hardware Upgrade",
    description: "Creates patterns slightly faster",
    src: `${BASE}img/icons/speedometer.svg`,
    baseCost: 50,
    scale: 2.0,
    currency: "money"
  },
  expGain: {
    name: "Learning Algorithm",
    description: "Patterns gain more EXP",
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
    src: `${BASE}img/icons/speedometer.svg`,
    baseCost: 2,
    scale: 2.5,
    currency: "prestige"
  },
  prestigeClick: {
    name: "Iron Will",
    description: "Permanently increases click power by 20%",
    src: `${BASE}img/icons/hand-pointer.svg`,
    baseCost: 1,
    scale: 3.0,
    currency: "prestige"
  }
}