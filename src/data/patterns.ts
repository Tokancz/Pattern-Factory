const BASE = import.meta.env.BASE_URL

export const PATTERNS = {
  square: {
    baseValue: 1,
    type: "money",
    visuals: {
      icon: BASE + "img/patterns/Square.svg",
      slot: BASE + "img/slots/SquareSlot.svg"
    },
    requirements: null // default owned
  },
  triangle: {
    baseValue: 5,
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
    type: "special",
    visuals: {
      icon: `${BASE}img/patterns/Cross.svg`,
      slot: `${BASE}img/slots/CrossSlot.svg`
    },
    requirements: {
      level: 10,
      dc: 50
    }
  }
}