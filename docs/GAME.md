# Game Design Reference

This is the mechanical reference for every system in Pattern Factory. It
describes what the player sees, the formulas behind the numbers, and how
the systems chain into each other. For the lore and the post-launch
expansion design, see [EXPANSION.md](./EXPANSION.md).

---

## Table of contents

1. [Currencies](#1-currencies)
2. [Patterns](#2-patterns)
3. [Slots / threads](#3-slots--threads)
4. [Upgrades (Protocols)](#4-upgrades-protocols)
5. [Machines (Modules)](#5-machines-modules)
6. [Synergies (Resonances)](#6-synergies-resonances)
7. [Anomalies (Bosses)](#7-anomalies-bosses)
8. [Prestige (Re-render)](#8-prestige-re-render)
9. [Ascension & Glyph upgrades](#9-ascension--glyph-upgrades)
10. [Endgame: the Architect's Choice](#10-endgame-the-architects-choice)
11. [Offline progression](#11-offline-progression)

---

## 1. Currencies

There are five currencies, each tied to a different reset layer.

| Currency       | Symbol | Earned from           | Resets on…       | Used for                                |
| -------------- | ------ | --------------------- | ---------------- | --------------------------------------- |
| Money          | IGM    | Square pattern        | Prestige         | Standard upgrades, machines             |
| EXP            | —      | Triangle pattern      | Prestige         | Architect level (gates content)         |
| Drift Coins    | DC     | Circle pattern, anomalies | Ascension    | DC upgrades (per-pattern speed/output)  |
| Prestige Pts   | PP     | Cross pattern, money-on-prestige | Ascension | Prestige upgrades (permanent boosts)  |
| Glyphs         | Γ      | Glyph pattern, ascending | Never         | Glyph upgrade tree (4 tiers)            |

Internal field names (`money`, `dc`, `prestige_points`, `glyphs`) are
stable — the UI labels are lore re-skins, the data fields aren't.

---

## 2. Patterns

Each pattern is a "thread template" — assigned to a slot, the slot
fills its progress bar over time, and on completion mints a unit of the
pattern's currency. Defined in [src/data/patterns.ts](../src/data/patterns.ts).

| Pattern  | Currency | Base value | Base progress | Unlock           |
| -------- | -------- | ---------- | ------------- | ---------------- |
| Square   | IGM      | 1          | 100           | Always           |
| Triangle | EXP      | 2          | 200           | 100 IGM          |
| Circle   | DC       | 1          | 250           | Lvl 15 + 1 000 IGM |
| Cross    | PP       | 1 (→ pending PP) | 4 000  | Lvl 25 + 500 DC  |
| Glyph    | Γ        | 1 (→ pending Γ)  | 2 000  | Glyph Pattern upgrade (Tier 3) |

**Foundation** (Tier 1 Glyph upgrade) discounts Triangle/Circle/Cross
unlock costs by 50%.

**Cross is auto-only** by default — paradox can't be forced. The
**Echo of the Cross** Glyph upgrade makes it clickable on a 10s
cooldown; **Cross Resolution** stacks (10s → 7s → 4s → 1s).

Per-pattern levels and EXP are tracked in
[src/stores/pattern.ts](../src/stores/pattern.ts). Level scales the
currency the pattern generates and feeds level-aware synergies (see § 6).

---

## 3. Slots / threads

A slot is a render thread. The Reality Engine has up to **5 slots**:

- 4 are unlockable in the base game via the **Scale-Out** module.
- The 5th unlocks only after buying the **Slot V** Glyph upgrade
  (Tier 1). On purchase, the next free slot opens immediately so the
  player doesn't have to grind another Scale-Out in the same run; on
  prestige reset, Slot V also grants an additional starting thread
  ([src/stores/slot.ts](../src/stores/slot.ts)).

A slot has its own pattern, progress, speed multiplier, and output
multiplier. Each tick:

```
speed = baseSpeed × slot.speedMultiplier × upgrades.getSpeedMultiplier
        × machines.slotBoost.multiplier × dcSpeedBonus(pattern)
        × synergy.getSpeedMultiplier(pattern)

(if slot is selected) speed × machines.targetedBoost.multiplier
```

…and on completion:

```
output = pattern.baseValue × slot.outputMultiplier
       × machines.outputBoost.multiplier
       × upgrades.getPrestigeOutputBonus
       × dcOutputBonus(pattern)
       × synergy.getOutputMultiplier(pattern)
```

Both formulas live in [src/stores/slot.ts](../src/stores/slot.ts).

---

## 4. Upgrades (Protocols)

Three independent upgrade pools, by reset layer
([src/data/upgrades.ts](../src/data/upgrades.ts)):

### 4.1 Money upgrades — wipe on prestige

| Upgrade                | Effect                                   | Scaling |
| ---------------------- | ---------------------------------------- | ------- |
| Muscle Up!             | +click power                             | ×2.4    |
| Worthy Squares         | +Square output                           | ×2.5    |
| Hardware Acceleration  | +slot speed                              | ×2.2    |
| Learning Algorithm     | +EXP gain                                | ×2.0    |
| Not Connected          | +offline cap                             | ×1.8    |
| Autopilot              | +offline multiplier                      | ×2.2    |

`cost(level) = baseCost × scale^level`. Muscle Up! caps at level 10.

### 4.2 DC upgrades — survive prestige, wipe on ascension

Two per pattern: speed and output.

| Pattern  | Speed name      | Output name     |
| -------- | --------------- | --------------- |
| Square   | Square Speed    | Square Value    |
| Triangle | Triangle Speed  | Triangle Value  |
| Cross    | Cross Speed     | Cross Value     |

(Circle has a global DC speed effect via machines, not a DC upgrade.)
Each starts at 50–75 DC, scales ×2.0.

**Pattern Memory** (Tier 4 Glyph upgrade) makes DC upgrades survive
prestige too — only ascension wipes them after that.

### 4.3 Prestige upgrades — permanent until ascension

| Upgrade               | Effect                              |
| --------------------- | ----------------------------------- |
| Reinforced Production | +15% global slot output             |
| Eternal Momentum      | +10% global slot speed              |
| Iron Will             | +20% click power                    |

Costs scale ×2.5–×3.0 in PP. Wiped only by ascension.

---

## 5. Machines (Modules)

Six machines, all bought with IGM, all wipe on prestige
([src/data/machines.ts](../src/data/machines.ts)). Each level applies
the same multiplier again — i.e. multiplier compounds as `value^level`.

| Module               | Effect                       | Base cost / scale |
| -------------------- | ---------------------------- | ----------------- |
| Scale-Out            | Unlocks one new slot         | 200 / ×15         |
| Advanced Engineering | +25% global slot speed       | 500 / ×8          |
| Overclock            | +75% one slot's speed (Shift+click to select) | 800 / ×4 |
| Industrial Press     | +20% global output           | 1 200 / ×5        |
| Neural Trainer       | +30% EXP gain                | 600 / ×5          |
| Pattern Resonator    | +15% magnitude on every active synergy | 1 500 / ×6 |

**Scale-Out** is special: the cap is **4** by default, **5** once Slot V
is owned. The store getter `slots.maxSlots` is the single source of
truth ([src/stores/slot.ts:51](../src/stores/slot.ts#L51)).

---

## 6. Synergies (Resonances)

Synergies fire when the **slot composition** matches a required pattern
multiset. There are 8 categories:

| Type     | Slots used | Shape           | Examples                    |
| -------- | ---------- | --------------- | --------------------------- |
| pair     | 2          | 1+1             | Growth Engine               |
| triple   | 3          | 1+1+1           | Core Triad, Ascension Path  |
| dual     | 4          | 2+2             | Twin Cores: Prosperity      |
| dominant | 4          | 3+1             | Dominant: Wealth            |
| full     | 4          | 1+1+1+1         | Perfect Factory             |
| accord   | 5          | 3+2             | Industrial Accord           |
| tyrant   | 5          | 4+1             | Tyrant of Mass              |
| spectrum | 5          | 1+1+1+1+1       | Full Spectrum               |

Defined in [src/data/synergies.ts](../src/data/synergies.ts), evaluated
in [src/stores/synergy.ts](../src/stores/synergy.ts).

### Visibility gates

To avoid spoiling unreleased mechanics:

- **5-slot synergies** (accord/tyrant/spectrum) stay hidden until the
  5th slot is actually unlocked.
- **Synergies that include the Glyph pattern** stay hidden until the
  player owns the **Glyph Pattern** Tier-3 Glyph upgrade.

The filter is in `synergy.ts → visibleSynergies`; the
`activeSynergies` and `pendingSynergies` lists piggy-back on it so
locked synergies never appear in the panel either.

### Activation rules

Default: composition must match `requiredCounts` exactly. Over-stuffing
(more of the wrong pattern) **breaks** the synergy.

**Resonance** (Tier 3 Glyph upgrade) widens the rule: a composition
that's missing exactly **one** required pattern still activates the
synergy. Over-stuffing is still disallowed — Resonance forgives a
missing pattern, not extras.

### Some synergies scale with level

Three of them (`temporal_mastery`, `perfect_factory`, `full_spectrum`)
multiply by an `avg level` or `min level` factor. The exact formula
lives next to the synergy definition.

### Pattern Resonator amplification

`synergyAmplifier = 1 + machines.synergyBoost.level × 0.15`. Each
synergy's effect-above-1 is multiplied by this, so e.g. `1.20` becomes
`1.20 + 0.20·(amp − 1)`.

---

## 7. Anomalies (Bosses)

Anomalies appear at random intervals (3–6 minutes;
[src/data/bosses.ts](../src/data/bosses.ts)) and target one of the 4
pattern types. To defeat one, click the boss button N times within the
time limit:

| Pattern  | Clicks | Time |
| -------- | ------ | ---- |
| Square   | 150    | 60 s |
| Triangle | 200    | 60 s |
| Circle   | 250    | 60 s |
| Cross    | 300    | 60 s |

**Defeat** rewards DC. **Failure** drains some of one currency
(money / EXP / DC / prestige).

Glyph upgrades that interact with anomalies:

- **Anomaly Resistance** (Tier 2): −25% required clicks.
- **Anomaly Shielding** (Tier 2): only one currency type can be drained
  on failure, never the rarest you hold.
- **Engine Override** (Tier 4): anomalies appear half as often.

The Glyph pattern has **no** anomaly — by lore design, the player's
own signature can't glitch.

---

## 8. Prestige (Re-render)

Triggered manually once `money ≥ prestigeThreshold`
(1 000 000 IGM, or 500 000 with the **Threshold** Glyph upgrade).

Money is converted to **Prestige Points (PP)** with sqrt scaling:

```
ppFromMoney = floor( sqrt(money / 100 000) )
ppGained    = ppFromMoney + floor(pendingPrestigePoints)
```

Examples (no Threshold): 1 M → 3 PP; 4 M → 6 PP; 25 M → 15 PP.

On confirm:

- All money/EXP/level state is wiped (`game.resetRun`).
- `patterns.reset()` re-locks every pattern except Square.
- `slots.reset()` re-locks every slot except slot 0 (and slot 1 if
  Slot V is owned).
- Money + DC upgrades wipe (`upgrades.reset()`); prestige upgrades
  remain. **Pattern Memory** keeps DC upgrades too.
- Machines wipe.
- **Boot Sequence** grants 100 starting DC.
- **Stable Loop** preserves 1 random non-Square unlocked pattern.

PP itself does not reset — it accumulates across prestiges and only
clears on ascension. PP is also the leaderboard's primary sort key.

---

## 9. Ascension & Glyph upgrades

Available once `level ≥ 100`. A deeper reset than prestige: in addition
to the prestige wipe, it also clears PP, prestige upgrades, and
ascension count goes up by one.

Reward:

```
glyphsGained = 1 + floor(pendingGlyphs)
```

The base 1 Γ comes from crossing the level-100 threshold; the rest
comes from glyph patterns produced this run. **Glyph Genesis** doubles
the per-pattern Γ rate.

### Glyph upgrade tree

Four tiers, each unlocking after the previous tier has at least
`TIER_UNLOCK_REQUIREMENT = 2` upgrades owned. Full table in
[src/data/glyphUpgrades.ts](../src/data/glyphUpgrades.ts); summary by
tier:

| Tier 1 — Foothold       | Tier 2 — Resilience    | Tier 3 — Inscription | Tier 4 — Recursion |
| ----------------------- | ---------------------- | -------------------- | ------------------ |
| Slot V                  | Anomaly Resistance     | Glyph Pattern        | Recursive Click    |
| Boot Sequence           | Anomaly Shielding      | Cross Resolution ★   | Pattern Memory     |
| Threshold               | Echo of the Cross      | Resonance            | Engine Override    |
| Foundation              | Time Dilation          | Glyph Genesis        | Final Pattern      |
|                         | Stable Loop            |                      |                    |

★ Cross Resolution is the only stackable one — `maxLevel: 3`,
`costPerLevel: [7, 8, 10]`.

Some upgrades have explicit prerequisites:
- Cross Resolution → needs Echo of the Cross
- Glyph Genesis    → needs Glyph Pattern
- Final Pattern    → needs Glyph Genesis

### Architect title

The leaderboard shows an "Architect title" derived from
`ascensionCount` ([src/utils/architect.ts](../src/utils/architect.ts)).
Players who end the game (Stabilize) get the title **Anchor**.

---

## 10. Endgame: the Architect's Choice

Triggers once the player owns **Final Pattern** AND has produced
≥ `ENDGAME_GLYPH_PATTERN_THRESHOLD` (1 000) Γ patterns lifetime
(`glyphPatternCount` is a lifetime counter, never reset).

The choice presented to the player:

- **Stabilize** — locks the engine in place. Game keeps running passively;
  Architect title becomes "Anchor". One-way; no return without a fresh
  account.
- *(Compile is reserved for a future expansion — see
  [EXPANSION.md § 6](./EXPANSION.md).)*

Server stores the endgame state in `game_saves.endgame_state`
(VARCHAR(20) — `null | 'stabilized'`).

---

## 11. Offline progression

When the client loads, it computes time elapsed since `last_played` and
ticks every slot forward, capped by:

```
offlineCap = base × (1 + offlineCapUpgradeLevel × …)
gain      *= offlineGainMultiplier
```

The cap is hard-clamped at 24h server-side via a safe-delta in
[slot.ts:88](../src/stores/slot.ts#L88) — even if the client clock
drifts, no slot can advance more than 24h of progress in a single tick.
**Time Dilation** (Tier 2 Glyph upgrade) gives +50% offline cap.
