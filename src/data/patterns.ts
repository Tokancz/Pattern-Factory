const BASE = import.meta.env.BASE_URL

export const PATTERNS = {
  square: {
    baseValue: 1,
    type: "money",
    visuals: {
      icon: BASE + "img/patterns/Square.svg",
      slot: BASE + "img/slots/SquareSlot.svg"
    }
  },
  triangle: {
    baseValue: 1,
    type: "exp",
    visuals: {
      icon: `${BASE}img/patterns/Triangle.svg`,
      slot: `${BASE}img/slots/TriangleSlot.svg`
    }
  },
  circle: {
    baseValue: 1,
    type: "dc",
    visuals: {
      icon: `${BASE}img/patterns/Circle.svg`,
      slot: `${BASE}img/slots/CircleSlot.svg`
    }
  },
  cross: {
    baseValue: 1,
    type: "special",
    visuals: {
      icon: `${BASE}img/patterns/Cross.svg`,
      slot: `${BASE}img/slots/CrossSlot.svg`
    }
  }
}