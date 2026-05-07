const BASE = import.meta.env.BASE_URL

export const TUTORIAL_STEPS = [
  {
    title: "Welcome, Architect.",
    description: "You run the Reality Engine. Manage threads, assign patterns, and keep the substrate stable.",
  },
  {
    title: "Selecting Threads",
    description: "Hover a thread and scroll to choose between pattern types. SHIFT + CLICK on a thread to overclock it.",
    image: `${BASE}img/tutorial/Tutorial 1.png`,
  },
  {
    title: "Pattern Types",
    description: "Patterns generate substrate resources: IGM (Iterative Generation Mass), EXP, DC (Drift Coins), and PP (Persistence Points).",
    image: `${BASE}img/tutorial/Tutorial 2.png`,
  },
  {
    title: "Protocols",
    description: "Protocols increase click power, render speed, offline cap, and other engine parameters.",
    image: `${BASE}img/tutorial/Tutorial 3.png`,
  },
  {
    title: "Modules",
    description: "Modules provide passive engine effects — thread unlocks, global speed, targeted overclock, and more.",
    image: `${BASE}img/tutorial/Tutorial 4.png`,
  },
  {
    title: "Resonances",
    description: "Some pattern combinations resonate — activating bonuses for specific patterns while the resonance holds.",
    image: `${BASE}img/tutorial/Tutorial 5.png`,
  },
  {
    title: "Anomalies",
    description: "Glitches in the engine occasionally manifest as Anomalies. Click to fight them off — fail and one of your currencies is drained.",
    image: `${BASE}img/tutorial/Tutorial 6.png`,
  },
  {
    title: "The Registry",
    description: "Submit your run to the Registry to compare your stability with other Architects.",
    image: `${BASE}img/tutorial/Tutorial 7.png`,
  },
  {
    title: "Begin.",
    description: "Experiment with thread composition, protocols, and modules to keep the substrate humming."
  }
]
