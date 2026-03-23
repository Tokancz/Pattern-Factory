const BASE = import.meta.env.BASE_URL

export const MACHINES = {
  slotUnlock: {
    name: "Scale-Out",
    description: "Unlocks a new pattern slot",
    src: `${BASE}img/icons/server-plus.svg`,
    baseCost: 100,
    scale: 2,

    effect: ({ slots }: any) => {
      slots.unlockSlot()
    }
  },

  slotBoost: {
    name: "Overclock",
    description: "Boosts all slot speed",
    src: `${BASE}img/icons/flame.svg`,
    baseCost: 200,
    scale: 2.2,

    effect: ({ slots }: any) => {
      slots.baseSpeed *= 1.2
    }
  },

  targetedBoost: {
    name: "Advanced Engineering",
    description: "Boosts selected slot",
    src: `${BASE}img/icons/flask-outline.svg`,
    baseCost: 300,
    scale: 2.5,

    effect: ({ slots }: any) => {
      // placeholder for later (target system)
    }
  }
}