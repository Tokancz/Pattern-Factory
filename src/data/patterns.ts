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
    baseProgress: 100,
    type: "exp",
    visuals: {
      icon: `${BASE}img/patterns/Triangle.svg`,
      slot: `${BASE}img/slots/TriangleSlot.svg`
    },
    requirements: {
      money: 50 // cost to unlock
    }
  },
  circle: {
    baseValue: 1,
    type: "dc",
    baseProgress: 200,
    visuals: {
      icon: `${BASE}img/patterns/Circle.svg`,
      slot: `${BASE}img/slots/CircleSlot.svg`
    },
    requirements: {
      level: 5,
      money: 200
    }
  },
  cross: {
    baseValue: 1,
    type: "prestige",
    baseProgress: 1000,
    visuals: {
      icon: `${BASE}img/patterns/Cross.svg`,
      slot: `${BASE}img/slots/CrossSlot.svg`
    },
    requirements: {
      level: 15,
      dc: 100
    }
  }
}