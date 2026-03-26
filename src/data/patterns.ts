const BASE = import.meta.env.BASE_URL

export const PATTERNS = {
  square: {
    baseValue: 1,
    baseProgress: 100,
    type: "money",
    visuals: {
      icon: BASE + "img/patterns/Square.svg",
      slot: BASE + "img/slots/SquareSlot.svg"
    },
    requirements: null // default owned
  },
  triangle: {
    baseValue: 2,
    baseProgress: 200,
    type: "exp",
    visuals: {
      icon: `${BASE}img/patterns/Triangle.svg`,
      slot: `${BASE}img/slots/TriangleSlot.svg`
    },
    requirements: {
      money: 100 // cost to unlock
    }
  },
  circle: {
    baseValue: 1,
    type: "dc",
    baseProgress: 250,
    visuals: {
      icon: `${BASE}img/patterns/Circle.svg`,
      slot: `${BASE}img/slots/CircleSlot.svg`
    },
    requirements: {
      level: 5,
      money: 1000
    }
  },
  cross: {
    baseValue: 1,
    type: "prestige",
    baseProgress: 4000,
    visuals: {
      icon: `${BASE}img/patterns/Cross.svg`,
      slot: `${BASE}img/slots/CrossSlot.svg`
    },
    requirements: {
      level: 25,
      dc: 250
    }
  }
}