const BASE = import.meta.env.BASE_URL

export const UPGRADES = {
  clickingPower: {
    name: "Muscle Up!",
    description: "Increases click power",
    src: `${BASE}img/icons/hand-pointer.svg`,
    baseCost: 10,
    scale: 1.5
  },
  sellMultiplier: {
    name: "Worthy Squares",
    description: "Sell squares for more IGM",
    src: `${BASE}img/icons/bx-dollar-circle.svg`,
    baseCost: 50,
    scale: 1.6
  },
  creationSpeed: {
    name: "Hardware Upgrade",
    description: "Creates parts faster",
    src: `${BASE}img/icons/speedometer.svg`,
    baseCost: 30,
    scale: 1.4
  },
  expGain: {
    name: "Learning Algorithm",
    description: "Patterns gain more EXP",
    src: `${BASE}img/icons/brain.svg`,
    baseCost: 40,
    scale: 1.5
  },
  offlineCap: {
    name: "Not Connected",
    description: "Increases max offline earnings",
    src: `${BASE}img/icons/wifi-slash.svg`,
    baseCost: 30,
    scale: 1.4
  },
  offlineGain: {
    name: "Autopilot",
    description: "Increaser offline multiplier",
    src: `${BASE}img/icons/robot.svg`,
    baseCost: 100,
    scale: 1.7
  }
}