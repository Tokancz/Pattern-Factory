// Architect rank tiers, ordered high → low. Title resolves to the first
// tier whose `min` is met. The Anchor title overrides everything once the
// player has reached the Stabilize endgame (Phase 4).
//
// Phase 0 ships everyone as "Initiate" — once Ascension lands in Phase 1
// the ascensionCount input becomes meaningful.
export const ARCHITECT_TIERS = [
  { min: 100, title: "Substrate" },
  { min: 50,  title: "Engine Voice" },
  { min: 15,  title: "Recursionist" },
  { min: 5,   title: "Pattern Walker" },
  { min: 1,   title: "Architect" },
  { min: 0,   title: "Initiate" },
] as const

export function architectTitle(ascensionCount: number, stabilized = false): string {
  if (stabilized) return "Anchor"
  for (const t of ARCHITECT_TIERS) {
    if (ascensionCount >= t.min) return t.title
  }
  return "Initiate"
}
