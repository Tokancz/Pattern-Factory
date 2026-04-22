const BASE = import.meta.env.BASE_URL

export const TUTORIAL_STEPS = [
  {
    title: "Welcome to Pattern Factory!",
    description: "Here you’ll manage slots, assign patterns, and automate production.",
  },
  {
    title: "Selecting Slots",
    description: "By hovering on slot and scrolling you can choose from different pattern types. SHIFT + CLICK on slot to activate overclock.",
    image: `${BASE}img/tutorial/Tutorial 1.png`,
  },
  {
    title: "Pattern Types",
    description: "Patterns give different resources: money, EXP, DC or prestige.",
    image: `${BASE}img/tutorial/Tutorial 2.png`,
  },
  {
    title: "Upgrades",
    description: "Upgrades increase click power, speed, offline gains, and more.",
    image: `${BASE}img/tutorial/Tutorial 3.png`,
  },
  {
    title: "Machines",
    description: "Machines provide special effects. Example: Slot unlock, global speed, targeted boost.",
    image: `${BASE}img/tutorial/Tutorial 4.png`,
  },
  {
    title: "Synergies",
    description: "Some pattern combinations unlock synergy wich will boost specific patterns.",
    image: `${BASE}img/tutorial/Tutorial 4.png`,
  },
  {
    title: "Bosses",
    description: "In random intervals, a boss will appear. Defeat it by clicking to secure your money, EXP, DC or prestige.",
    image: `${BASE}img/tutorial/Tutorial 4.png`,
  },
  {
    title: "Global Ranking",
    description: "Compare your progress with others by submiting yout score.",
    image: `${BASE}img/tutorial/Tutorial 4.png`,
  },
  {
    title: "Enjoy!",
    description: "Experiment with slot selection, upgrades, and machines to maximize production."
  }
]