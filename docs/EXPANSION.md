# Pattern Factory — Reality Engine Expansion

This document describes a planned content expansion adding lore, an Ascension
layer, and a true ending to Pattern Factory. Nothing here is implemented yet
— this is the design spec.

---

## 1. Story: The Reality Engine

The factory is not making products. It is **stabilizing reality itself**.

Every pattern the factory produces is a primitive that holds the simulation
together. The geometry isn't decorative — squares, triangles and circles are
the literal building blocks the engine uses to render existence.

### The roles

| In-game thing      | Lore role                                                 |
|--------------------|-----------------------------------------------------------|
| The factory        | A Reality Engine — a substrate that renders existence.    |
| The player         | An **Architect**, an emergent intelligence inside the engine. |
| Patterns           | Primitives the engine uses to keep reality coherent.      |
| Slots              | Engine threads — parallel render pipelines.               |
| Bosses             | **Anomalies / Glitches** — corruption events trying to destabilize the render. |
| Synergies          | Resonances — primitives reinforcing each other.           |
| Prestige (PP)      | **Re-render** — collapsing this iteration of reality, restarting cleaner with carryover knowledge. |
| Ascension (Glyphs) | **Recursion** — transcending a layer of the engine. A Glyph is a stable shard of meta-reality that survives across realities. |

### What each pattern represents

| Pattern   | Meaning            |
|-----------|--------------------|
| Square    | Order, structure   |
| Triangle  | Energy, change     |
| Circle    | Continuity, time   |
| Cross     | Paradox, conflict  |
| **Glyph** | **Self** — the Architect's signature inscribed into the engine's substrate. |

The Cross can't be clicked because paradox can't be forced — it resolves on
its own. The **Echo of the Cross** Glyph upgrade lets the Architect *force*
a paradox to resolve manually (see § 5).

---

## 2. UI Naming & Lore Surfacing

The lore only matters if the player encounters it. The expansion shifts the
UI from gameplay-first naming ("Boss", "Prestige") to lore-first naming
("Anomaly", "Re-render"), with one-line descriptions wherever there's space.

### 2.1 Renaming map

This is a starting proposal — pick what feels right per item. Internal
field names (`money`, `dc`, `prestige_points`) **stay unchanged** to avoid
breaking saves; only the UI labels change. Currency abbreviations are kept
so existing players aren't disoriented; their full names are reframed via
tooltips.

| Current (UI)        | Proposed lore name                       | Notes                                    |
|---------------------|------------------------------------------|------------------------------------------|
| Boss / Boss Fight   | **Anomaly** / **Anomaly Detected**       | Already named "Anomalies" in lore.       |
| Prestige (action)   | **Re-render**                            | Sub-tab keeps "Prestige" as gameplay term, lore subtitle "Re-render". |
| Prestige (top tab)  | **Recursion** *(or Cycles / Layers)*     | Top tab houses both Prestige + Ascension sub-tabs. |
| Ascension           | **Recursion** *(action verb: "Recurse")* | Sub-tab name: **Ascension**.             |
| Patterns            | (keep)                                   | Already lore-fitting.                    |
| Upgrades            | **Protocols**                            | Operational instruction sets.            |
| Synergies           | **Resonances**                           | Pattern resonances reinforcing each other. |
| Machines            | **Modules** *(or Subsystems)*            | Engine modules.                          |
| Inventory           | **Archive** *(or Catalog)*               | Catalogued patterns.                     |
| Ranking             | **Registry** *(or Architects' Registry)* | Where Architects are recorded.           |
| Factory Name (reg.) | **Engine Designation**                   | Registration field on Login screen.      |
| IGM (full meaning)  | "Iterative Generation Mass"              | Keep abbreviation IGM.                   |
| DC (full meaning)   | "Drift Coins" *(residue from anomalies)* | Keep abbreviation DC.                    |
| PP (full meaning)   | "Persistence Points"                     | Keep abbreviation PP.                    |
| Γ                   | Glyphs                                   | New, already lore.                       |

Description text (currently empty on most views) gets a one-line lore tag
per item — see § 2.3.

### 2.2 First-login flavour screen

After registration completes (or on the very first login of an existing
user post-deploy), a one-time fullscreen modal opens before anything else.
It is **not skippable by chance** — if the player closes the tab they see
it again next session, so we know they encountered it.

**Content**: a short text crawl — about 4–6 short paragraphs — that
introduces the Reality Engine, names them as Architect, hints at Anomalies,
and ends with the choice between two buttons.

**Buttons**:
- **Continue** — dismisses the screen. Player goes straight to the game.
- **Tutorial** — dismisses the screen *and* opens the existing tutorial
  overlay (component already exists).

After dismissal, a `seenIntro: true` flag is saved on the user record. The
modal is also re-openable from the simulation panel's *Tutorial* button so
returning players can re-read it.

Sketch of the text (placeholder, refine later):

> *You wake into a structure that runs on patterns.*
>
> *The factory around you is a Reality Engine. Squares give it order.
> Triangles give it energy. Circles give it time. The crosses are
> paradoxes — leave them be, they resolve on their own.*
>
> *You are an Architect. Inside this engine, you keep the patterns
> running, and reality holds.*
>
> *Sometimes the engine glitches. Anomalies will try to interrupt
> production. Hold them off.*
>
> *Reality bends when you re-render it. It transcends when you
> recurse. Every layer makes you more permanent.*
>
> *Begin.*

### 2.3 Pattern descriptions

The Patterns view is currently almost empty per card. Each pattern gets:

- **A short flavour line** (one sentence, lore-first).
- **A clarifying sub-line** (mechanical role).

Examples:

| Pattern  | Flavour line                              | Mechanical line                  |
|----------|-------------------------------------------|----------------------------------|
| Square   | "Order. Structure. The default render."   | Generates IGM. Click-friendly.   |
| Triangle | "Energy in motion."                       | Generates EXP.                   |
| Circle   | "Continuity. Time loops back."            | Generates DC at slow base rate.  |
| Cross    | "A paradox. It resolves on its own."      | Cannot be clicked. Auto-only.    |
| Glyph    | "Your signature in the substrate."        | Generates pending Glyphs (slow). |

Implementation: extend the pattern data structure with `flavour: string` and
optionally `roleHint: string`, and render both in PatternView card body and
on the Inventory view.

### 2.4 Architect titles

Players accumulate a **rank** based on their total lifetime ascensions.
The title shows next to the username in the header, on the Registry
(Leaderboard), and on the user profile.

| Total ascensions | Title           |
|------------------|-----------------|
| 0                | Initiate        |
| 1–4              | Architect       |
| 5–14             | Pattern Walker  |
| 15–49            | Recursionist    |
| 50–99            | Engine Voice    |
| 100+             | Substrate       |
| (any) Stabilized | **Anchor**      |

"Anchor" is the special endgame title (see § 6) and overrides the
ascension-count title once the Stabilize ending is reached. Counts and
labels are tunable.

Stored as a derived value on the user record (`ascension_count` is the
authoritative field; the title is computed at render time).

---

## 3. Changes to existing systems

The expansion is not purely additive — it changes a few existing rules:

### 3.1 Prestige now wipes DC + DC upgrades

**Currently**, prestiging keeps DC and DC upgrades. With the expansion,
prestige wipes both. This makes:
- The **Boot Sequence** Glyph upgrade meaningful (free DC head-start each
  prestige).
- The **Pattern Memory** Tier 4 Glyph upgrade meaningful (its whole effect
  is preserving DC upgrades through prestige).
- The prestige loop tighter — fewer "permanent" carryovers, more reset, so
  PP feels weightier.

**Implementation**: the `gameStore.prestige()` action needs to also reset
`dc`, all DC upgrade levels, and the DC upgrade tree. Ascending wipes the
same things plus PP, levels, and Glyph-pattern flags (see § 4).

This is a balance change to existing players' experience and should ship
in the same release as Glyphs so the trade-off (DC-wipe + Glyph permanence)
lands together.

### 3.2 Synergy expansion for 5 slots

Current synergies are designed around 4 slots (e.g. dominant-3, full-set-4).
With the 5th slot live, several new synergies become possible:

- **Full Spectrum** (5 distinct patterns) — strong all-around bonus, only
  reachable post-Glyph-Pattern.
- **Glyph Resonance** — any synergy that includes the 5th pattern; these
  should have stronger bonuses to reward reaching that gating point.
- **Asymmetric** synergies — e.g. "3 squares + 1 cross + 1 glyph" — to
  give 5-slot players novel arrangements.

Concrete synergy design is its own pass; I'd recommend doing it after
Phase 2 (when the 5th pattern is live) so it can be playtested in isolation.

---

## 4. Ascension: Glyphs (Γ)

### Trigger

- Available once the player reaches **level 100**.
- The Ascend button lives inside the renamed **Recursion** top tab, on the
  **Ascension** sub-tab (see § 7 implementation).
- Confirmation dialog warns about the wipe.

### What ascending does

| Wiped                                  | Kept                              |
|----------------------------------------|-----------------------------------|
| Money (IGM)                            | Glyphs (permanent)                |
| Dark Coins (DC) + DC upgrades          | Glyph upgrades (permanent tree)   |
| Prestige Points (PP) + PP upgrades     | Achievement / leaderboard records |
| Pending PP                             | Tutorial + intro completion flags |
| Level + EXP                            | Audio/UI preferences              |
| All upgrades (normal, DC, prestige)    | Architect title (lifetime)        |
| Pattern unlocks                        | Lifetime Glyph Pattern counter    |
| Machine levels                         | (for endgame trigger)             |
| Slot pattern assignments               |                                   |

The player goes back to a **fresh new run** with their permanent Glyph tree
intact.

### How Glyphs are earned

The formula is intentionally flat:

> **Glyphs awarded on Ascend = 1 + pending Glyphs**

- The flat **+1** is the cost of crossing the level-100 threshold. It does
  not scale with how high above 100 you went — reaching 250 awards the same
  base 1 as reaching 100. Going higher only matters because you've had more
  time to generate pending Glyphs.
- **Pending Glyphs** are produced exclusively by the 5th pattern (Glyph
  Pattern) during a run. They bank into permanent Glyphs when you Ascend
  (mirrors how pending PP works today).

Implication: the **first ascension always gives exactly 1 Glyph**, because
the Glyph Pattern is locked behind a Tier 3 Glyph upgrade and can't run
yet. Players spend that first Glyph on a Tier 1 upgrade, run again, and
the expansion gradually opens up.

Once the Glyph Pattern is unlocked, generation rate is slow — order of
magnitude **~1 pending Glyph per 30 minutes of active production** at base.
Glyph Genesis (Tier 3) doubles this. So a long, late-stage ascension might
yield 1 (base) + 5–10 (pending) Glyphs, making the 5th pattern the
primary unlock that opens the deep tree. **30 min is a starting value —
tune in playtest.**

### Why so rare

Glyphs are deliberately scarce because each one is a permanent,
account-level upgrade. A complete tree should take **dozens of ascensions**,
giving the expansion a long horizon.

### Why not multiplicative

Glyph upgrades **must not multiply existing multipliers**. PP × Glyph
stacking causes runs to evaporate in seconds, the middle game vanishes,
and balancing collapses. Instead, Glyph upgrades **soften the game** —
they remove friction, reduce penalties, and add small structural
advantages. They make later runs feel *gentler*, not *more powerful*.

---

## 5. Glyph Upgrade Tree

All upgrades are permanent across ascensions. Costs are starting points
and should be tuned in playtest.

### Tier 1 — Foothold (1–2 Γ)

Available immediately after first ascension.

| Upgrade           | Cost | Effect                                                       |
|-------------------|------|--------------------------------------------------------------|
| **Slot V**        | 2 Γ  | Unlock the 5th slot. Cheaper than Glyph Pattern intentionally. See Slot V notes below. |
| **Boot Sequence** | 1 Γ  | Start each prestige with 100 free DC. (Now meaningful — see § 3.1.) |
| **Threshold**     | 1 Γ  | First prestige available at 500k IGM instead of 1M.          |
| **Foundation**    | 2 Γ  | First 3 patterns cost 50% less to unlock.                    |

#### Slot V — UX requirements

This upgrade has a few non-obvious behaviour rules that need to be honored
when implementing:

- **Hidden until purchased.** The 5th slot must not appear anywhere in the
  UI before Slot V is bought. The player should not even know it exists.
  No greyed-out placeholder, no "locked" silhouette, no entry in the slot
  count. The Glyph upgrade itself is the only surface that reveals it.
- **Responsive layout.** With 5 slots active, the slot grid must reflow
  cleanly across breakpoints:
  - **Desktop**: a single row of 5 (`repeat(5, 1fr)`).
  - **Tablet (`md`)**: **3 on the first row, 2 centered below** (decided).
  - **Phone (`sm`)**: 2 + 2 + 1 with the 5th centered.

  The current 4-slot grid (`repeat(4, 1fr)` desktop / `repeat(2, 1fr)`
  mobile) needs to become slot-count-aware.
- **Prestige carryover.** With Slot V owned, prestiging starts the player
  with **2 unlocked slots** instead of 1. This compensates for the
  expansion's higher slot count and prevents the 5th slot from feeling
  like dead UI on a fresh prestige run. The 5th slot itself is *always
  available* once Slot V is owned — it just may need to be unlocked via
  the existing slotUnlock machine like any other.

### Tier 2 — Resilience (3–5 Γ)

Anomaly-focused; reduces friction.

| Upgrade                | Cost | Effect                                                  |
|------------------------|------|---------------------------------------------------------|
| **Anomaly Resistance** | 3 Γ  | Anomaly HP −25%.                                        |
| **Anomaly Shielding**  | 4 Γ  | On anomaly defeat, only one currency type can be stolen, never the rarest one held. |
| **Echo of the Cross**  | 5 Γ  | Cross pattern becomes clickable, with a **10s cooldown** between clicks. (See sub-note below.) |
| **Time Dilation**      | 3 Γ  | Offline cap +50% (stacks once with the existing upgrade). |
| **Stable Loop**        | 4 Γ  | Prestige now keeps **1 random unlocked pattern** (RNG). |

#### Echo of the Cross — cooldown details

"Once per run" was too restrictive (Cross click power vs progress threshold
makes the click essentially useless once per run). Updated rule:

- Clicking Cross while it's available immediately advances the cross
  pattern's progress as a normal click would for any other slot, **then
  starts a 10-second cooldown** during which Cross can't be clicked.
- The cooldown is **reducible** via a higher-tier upgrade (proposed:
  Tier 3 **"Cross Resolution"**, see below).

This makes Cross clicking a meaningful but limited tool, not a
once-a-lifetime gimmick.

### Tier 3 — Inscription (6–10 Γ)

This is where the 5th pattern enters.

| Upgrade               | Cost | Effect                                                   |
|-----------------------|------|----------------------------------------------------------|
| **Glyph Pattern**     | 8 Γ  | Unlocks the 5th pattern type (Glyph). Producing it generates pending Glyphs at a slow base rate. |
| **Cross Resolution**  | 7 Γ  | Echo of the Cross cooldown −5s (10s → 5s). Stackable up to 2× for −5s more (5s → 1s)? Tunable. |
| **Resonance**         | 7 Γ  | Synergies activate at **−1** required pattern count.     |
| **Glyph Genesis**     | 10 Γ | 5th pattern Glyph generation rate ×2.                    |

> *Architect's Sight* removed — pending PP is already displayed in
> CurrencyDisplay, so the upgrade was redundant. The slot it freed in
> Tier 3 went to **Cross Resolution**.

### Tier 4 — Recursion (15–25 Γ)

Capstone tier.

| Upgrade             | Cost | Effect                                                                |
|---------------------|------|-----------------------------------------------------------------------|
| **Recursive Click** | 18 Γ | Clicking a slot also clicks **adjacent** unlocked slots once.         |
| **Pattern Memory**  | 15 Γ | DC upgrades persist through prestige (reset only on Ascension). Pairs with § 3.1. |
| **Engine Override** | 20 Γ | Anomalies appear **half** as often.                                   |
| **Final Pattern**   | 25 Γ | Unlocks the **endgame** — see § 6. Producing 1000 Glyph Patterns triggers The Architect's Choice. |

### Tree shape

```
Tier 1 ───┬── Slot V ──────────────────┐
          ├── Boot Sequence ───────────┤
          ├── Threshold ───────────────┤
          └── Foundation ──────────────┤
                                       │
Tier 2 ───┬── Anomaly Resistance ──────┤
          ├── Anomaly Shielding ───────┤
          ├── Echo of the Cross ───────┤
          ├── Time Dilation ───────────┤
          └── Stable Loop ─────────────┤
                                       │
Tier 3 ───┬── Glyph Pattern ◄── gates ─┤
          ├── Cross Resolution ◄── needs Echo of the Cross
          ├── Resonance ───────────────┤
          └── Glyph Genesis ◄── needs Glyph Pattern
                                       │
Tier 4 ───┬── Recursive Click ─────────┤
          ├── Pattern Memory ──────────┤
          ├── Engine Override ─────────┤
          └── Final Pattern ◄── needs Glyph Pattern + Glyph Genesis
                  │
                  ▼
              ENDGAME
```

Tier requirements: each tier unlocks once at least 2 upgrades from the
previous tier are bought, so the player follows a soft progression curve.

---

## 6. The True Ending — The Architect's Choice

Triggered when the player has produced **1000 Glyph Patterns** total
(account-level counter, persists across ascensions). **1000 is a starting
value — tune based on feel.**

A full-screen modal appears. Slow text crawl establishes the reveal:

> *You have inscribed yourself into the engine one thousand times.*
>
> *The substrate now carries your signature.*
>
> *The factory was never running for the world — it was running for **you**.*
>
> *You are no longer an Architect inside the engine. You are part of the engine itself.*
>
> *Choose how to remain.*

Two buttons:

### Stabilize *(shippable in this expansion)*

> *Lock your pattern into the substrate. Reality holds.*

- Game enters **stable mode**. Factory continues running passively forever.
- Currency keeps accumulating but no further upgrades unlock.
- Architect title becomes **Anchor** on the Registry.
- A credits roll plays (one-time, replayable from a menu).
- This is the **finite ending** — closure for completionists.

### Compile *(deferred — sequel / future expansion)*

The Compile path is **out of scope for this expansion**. It would unlock a
hard reset into a new "Layer 2" mode with:

- A new gating currency (e.g. **Sigils**)
- Re-skinned Anomaly types with new mechanics
- Higher level cap, deeper synergy tree, post-Glyph upgrades

It's a substantial design and content effort — kept here as a hook for a
potential sequel or major expansion. For the current expansion, the
modal can ship with **only the Stabilize button**, and the Compile button
can either be greyed-out (with a "soon™" tooltip) or simply omitted until
sequel work begins.

### Why Stabilize is enough on its own

Stabilize gives genuine closure: the factory keeps running passively, the
player keeps their leaderboard rank, the credits roll, the Anchor title
shows on the Registry. That's a complete ending. Compile is a nice-to-have
that adds replayability, but the core narrative arc resolves cleanly with
Stabilize alone — so the expansion can ship without Compile blocking it.

---

## 7. Implementation notes (future work)

This is a sketch of where the expansion would touch the codebase. Not a
binding plan.

### New stores

- `useGlyphStore` — `pendingGlyphs`, `glyphs`, `boughtUpgrades: Record<id, number>`,
  `ascensionCount` (lifetime), `glyphPatternLifetimeCount` (for endgame).
- Glyph Pattern definition added to `data/patterns.ts` (5th type).
- Glyph upgrade definitions in a new `data/glyphUpgrades.ts`.
- Anomaly variants in `data/bosses.ts` reflavoured with glitch names.

### Ascension flow

1. Add `level >= 100` gate that surfaces the Ascend button on the
   Ascension sub-tab.
2. Confirmation dialog component (similar to PrestigeView's prestige
   button but with stronger warnings).
3. Ascend action: snapshot pending Glyphs → bank, increment
   `ascensionCount`, then run a hard-reset routine that mirrors
   `gameStore.prestige()` but **also** wipes PP/DC trees and resets
   levels.

### Save schema

- Add `glyphs` (number), `pending_glyphs` (number),
  `glyph_upgrades` (jsonb / serialized record),
  `ascension_count` (lifetime — drives titles),
  `glyph_pattern_count` (lifetime counter for endgame trigger),
  `endgame_state` (`null | "stabilized"`),
  `seen_intro` (bool — for first-login flavour screen).
- Bump save_version to invalidate older saves cleanly.

### Recursion tab — sub-tab UX

The current Prestige tab becomes the **Recursion** top-level tab and
hosts two sub-tabs:

- **Prestige** sub-tab — the current PrestigeView content.
- **Ascension** sub-tab — new view, only visible after `level >= 100`
  is reached at least once. Holds the Ascend button + the Glyph
  upgrade tree.

Visibility rules:

- Before any ascension: Ascension sub-tab shows a locked state (or
  hides entirely until first level-100). Existing players who already
  hit level 100 should see it on first load post-deploy.
- The **Glyph upgrade tree** itself is rendered inside the Ascension
  sub-tab — there's no separate top-level GlyphView. Tree only shows
  meaningfully populated after the **first ascension** completes;
  before that, the sub-tab shows only the Ascend prompt.

### UI surfaces

- New view: `AscensionView.vue` (Ascend button + Glyph upgrade tree),
  rendered inside the Recursion tab as a sub-tab.
- New component: `IntroOverlay.vue` (first-login flavour screen, see § 2.2).
- Stats panel gains a Γ row when first Glyph is earned.
- CurrencyDisplay gains a Γ pill when first Glyph is earned.
- Anomaly encounter banner subtitle ("ANOMALY · TYPE") added to BossFight.
- PatternView and InventoryView render the new flavour + role lines on
  each pattern card (§ 2.3).
- Header / Registry render the Architect title next to the username.
- Tutorial overlay gains an extra opt-in lore step.

### Slot grid changes (driven by Slot V)

- The slot grid (`Simulation.vue` `.slot-container`) currently hardcodes
  `repeat(4, 1fr)` at desktop and `repeat(2, 1fr)` at `md`. This must
  become slot-count-aware once Slot V is owned.
- Suggested approach: read the count of *visible* slots and switch
  templates:
  - Desktop: `repeat(5, 1fr)`
  - `md` (tablet): **3 + 2** layout — slots 1–3 fill the first row, slots
    4–5 sit centered in a second row.
  - `sm` (phone): 2 + 2 + 1 with the 5th centered.
- Crucially, the 5th slot must **not be rendered at all** until Slot V is
  bought — gate the v-for on a derived `visibleSlots` getter rather than
  rendering it locked.
- Prestige reset logic in `gameStore.prestige()` (and equivalent slot
  store) needs an `if (glyphUpgrades.has("slotV")) startUnlocked = 2`
  branch so the player drops into 2 unlocked slots post-prestige.

### Prestige reset (existing-game change)

`gameStore.prestige()` action currently keeps `dc` and DC upgrades. This
must change to wipe both — see § 3.1. Behavior gated on `Pattern Memory`:
if the upgrade is owned, the wipe is skipped for DC upgrades only.

### Pattern data

Extend the pattern data shape:

```ts
{
  baseValue, baseProgress, type, requirements, visuals,
  flavour: string,   // NEW — one-line lore tag
  roleHint: string,  // NEW — short mechanical hint
}
```

Render both lines in the PatternView and InventoryView card body.

### Glyph visual

Use the **Γ** glyph as a placeholder in CurrencyDisplay, Stats, and
ascension dialogs. SVG icon for the 5th pattern (animated/glitching shape)
to be designed later — leave the placeholder as a styled Γ in a square
frame for now.

### Lore touchpoints (cheap, high-impact)

- Pattern descriptions: § 2.3.
- Anomaly flavour text: glitch-themed subtitle.
- Ascend dialog: "RECURSION INITIATED — descending one layer…"
- Prestige dialog: subtitle "Re-render".
- First-login intro: § 2.2.

---

## 8. Open design questions

These are the calls remaining before any implementation:

1. **Recursion top-tab name** — "Recursion", "Cycles", "Layers" or just
   keep "Prestige"? I lean toward **Recursion**, but pick what reads best
   for you.
2. **Renaming map (§ 2.1)** — accept the map as proposed or veto specific
   renames? Some are bigger commitments than others (e.g. renaming the
   whole nav vs. just renaming Boss → Anomaly).
3. **Architect title list** — five tiers right (Initiate / Architect /
   Pattern Walker / Recursionist / Engine Voice / Substrate)? Add more,
   fewer, or rename?
4. **Cross Resolution stacking** — is one upgrade level (10s → 5s)
   enough, or do you want a stackable upgrade so the cooldown can drop
   to 1s eventually?
5. **Intro modal — text** — placeholder paragraphs in § 2.2 are mine;
   you may want to write your own voice for them.
6. **Tab vs. nested-tab UX** — does the Recursion → Prestige/Ascension
   nested-tab feel right, or would a separate top-level Ascension nav
   item be cleaner?
7. **DC wipe rollout** — the prestige-now-wipes-DC change in § 3.1 is a
   nerf to existing players. Want a one-time "compensation Glyph" on
   first deploy for existing accounts above some prestige threshold?

Notes confirmed (no longer questions):
- Glyph generation rate: 30 min base, tunable.
- Endgame trigger: 1000 Glyph Patterns, tunable.
- Glyph visual: Γ placeholder, glitching SVG later.
- NG+ / Compile: deferred to sequel.

---

## 9. Phased rollout suggestion

If you want to ship this incrementally rather than all at once:

- **Phase 0 — Naming pass**: Rename UI surfaces per § 2.1 (low-risk),
  add pattern descriptions per § 2.3, add the first-login flavour screen
  per § 2.2. Architect titles can also ride here (purely cosmetic).
  Ships *without* any Glyph mechanics — pure lore polish.
- **Phase 1 — Foundation**: Recursion tab + Ascension sub-tab,
  level-100 gate, Ascend action, Glyphs currency, Tier 1 + Tier 2
  upgrades, prestige DC wipe (§ 3.1). 5th slot gates behind Slot V.
- **Phase 2 — The 5th Pattern**: Tier 3, Glyph Pattern unlock, Glyph
  Genesis. Synergy expansion for 5 slots (§ 3.2). The "deep" ascension
  loop opens up.
- **Phase 3 — Recursion capstone**: Tier 4 upgrades, including
  Recursive Click, Engine Override, Pattern Memory, and Final Pattern
  (which gates the endgame trigger).
- **Phase 4 — The Architect's Choice (Stabilize)**: Endgame trigger,
  Stabilize ending, credits roll, Anchor title.

Compile / NG+ remains deferred (§ 6).

Each phase is shippable on its own and doesn't break previous saves.
Phase 0 is essentially zero-risk and can ship before Phase 1's design is
finalized.
