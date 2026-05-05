# George Droys — Game UI Design Spec

A replication guide for the hi-fi clicker UI. Use this to rebuild the screen in a different stack (React, Vue, Unity UI Toolkit, Figma, etc).

---

## 1. Visual identity

**Genre cue:** y2k arcade / brutalist clicker. Hard black backdrop, neon-lime accent, one violet "stage" panel that holds the actual gameplay, italic display serif against a chunky industrial mono. The whole thing is bordered by 3px lime — like a cartridge label.

### Color tokens
| Token | Hex | Role |
|---|---|---|
| `--bg` | `#000000` | Page + chrome background |
| `--paper` | `#FAFAF8` | Off-white inside the active tile + handwritten floats |
| `--green` | `#C5FF00` | Neon accent — borders, type, primary CTA fill |
| `--green-dark` | `#9CCC00` | Diagonal-stripe shadow color in level bar |
| `--purple` | `#7B1FE0` | Factory stage background |
| `--purple-dark` | `#5A14A8` | Empty/buy slot fill |
| `--purple-deep` | `#36096B` | Locked slot fill |
| `--ink` | `#000000` | Type on green, drop-shadow on tiles |
| `--muted` | `rgba(197,255,0,0.55)` | De-emphasized lime (labels, captions) |
| Boss bg (idle) | `#1a0030` | Right-rail boss block (default) |
| Boss bg (warn) | `#3a0010` | Card 5–4 sec before takeover |
| Boss bg (imminent) | `#5a0014 → #a50018` | Pulsing card 3–0 sec |
| Boss / hazard red | `#FF3B1A` | Threat color — countdown, hazard stripes, HP bar |
| Boss accent orange | `#FFB13D` | Warn-state timer color |
| Combo orange | `#FF6B3D` | Combo line in live feed |
| Boss vignette | `rgba(40,0,0,0.92) → rgba(80,0,10,0.97)` | Radial dim during takeover |

**Rule of three:** Black for chrome, lime for value, violet for stage. Boss takeover earns a fourth color — red — but only **inside the takeover overlay**. Don't bleed red into the chrome.

### Type stack
| Family | Where | Why |
|---|---|---|
| **Playfair Display** italic 900 | "FACTORY", "There.", "Feed.", "STATS", "BOSS", boss reveal title, "DEFEND!" | The romantic counterpoint to all the brutalism. Always italic, always heavy. |
| **Archivo Black** | Logo, large numerics (`4`, `×3`, `1`), footer values, **3-2-1 countdown digits** (340px), boss HP number | Display weight for hero numbers. |
| **JetBrains Mono** 700/800 | All small labels, codes (`IGH`, `DC`, `PP`), buttons, feed timestamps, takeover corner stamps, tag chips (`⚠ INCOMING`, `⚠ BOSS ENCOUNTER`) | Adds the "terminal / cartridge readout" feel. Letter-spacing 0.10–0.40em. |
| **Caveat** 700 | The handwritten `+4 / +1` damage floats | Human noise inside the machine. |

Pair only these four. If you swap, keep the archetypes: serif-italic display + heavy sans display + industrial mono + handwritten.

### Borders & strokes
- **Every panel border = 3px solid `--green`.** This is the single most important rule. The whole UI reads as a circuit board because of it.
- Inner dividers in the footer = `1.5px dashed rgba(0,0,0,0.25)`.
- Active tile = `4px solid black` + `6px 6px 0 0 black` hard drop shadow (no blur).
- Locked / buy slots = `3px dashed --paper` on violet fill.
- Boss takeover HP bar = `3px solid #FF3B1A`. Boss tag chip = `3px solid black`. FIGHT button = `3px solid black` + `5px 5px 0 black` shadow.
- **Never use border-radius.** Everything is square. Buttons, tiles, badges, bars — all sharp corners.

### Shadows
- Only **hard offset shadows** (e.g. `6px 6px 0 0 #000`, `5px 5px 0 0 #000` on FIGHT button). No soft gaussian blur in chrome.
- Boss reveal allows soft glows: boss artwork has `drop-shadow(0 0 24px rgba(255,59,26,0.6))` for the menacing aura, plus an 8/8/0 black hard shadow for the body. Idle rail card boss-art uses a softer green glow `drop-shadow(0 0 12px rgba(197,255,0,0.25))`.

---

## 2. Layout

```
┌────────────────────────────────────────────────────┐
│ HEADER  (logo · level+xp bar · IGH · DC · PP)      │  ← spans full width
├──────────────┬─────────────────────────┬───────────┤
│              │                         │           │
│  NAV (240)   │   CENTER (flex)         │  RAIL     │
│              │   ├ stat row            │  (320)    │
│              │   ├ FACTORY (purple)    │           │
│  ─────       │   └ slim strip          │  ─────    │
│  TUTORIAL    │                         │  almost   │
│              │                         │  ─────    │
│              │                         │  feed     │
│              │                         │  ─────    │
│              │                         │  BOSS     │  ← becomes the
│              │                         │  CARD     │     countdown card
├──────────────┴─────────────────────────┴───────────┤
│ FOOTER (lime band · 9 mini-stats · "by mates")     │
└────────────────────────────────────────────────────┘
```

- **Frame:** `1280 × 820`, fixed pixel size, centered on page. The whole thing is bordered by 3px lime — like a cartridge label.
- **Grid:** `grid-template-columns: 1fr 320px` for the body row; `auto 1fr auto` for header/body/footer.
- **Nav width:** 240. **Rail width:** 320. These ratios matter — the center panel is the visual hero.
- **Boss takeover overlay:** `position: absolute; inset: 0` over the entire frame. `display: grid; place-items: center`. Sits at `z-index: 100`, above everything except dev triggers.

---

## 3. Component recipes

### Header logo block
- Lime fill, black ink, `Archivo Black` 34px name.
- Sub-label is JetBrains Mono 800, 13px, letter-spacing `0.18em`, with a 2px solid black underline that hugs only the text width (`width: fit-content`).

### Level bar
- 14px tall, 2px lime border, 8% transparent lime fill.
- Fill itself is **45° diagonal stripes** alternating lime and dark lime every 6px.
- Overlay a `flex` row of 10 `<span>`s with a 1px black-25% right-border to create the tick segments. Last child has no border.

### Resource cells (IGH / DC / PP)
- Vertical stack: 13px JetBrains Mono code with 2px lime underline, big `Archivo Black` 30px number below.
- Three cells share a row, divided by 3px lime verticals.

### Nav items
- 6px transparent left-border that flips to white on `.active`.
- Active state: lime fill, black text. Hover: 8% lime tint.
- Label is **Playfair italic 900, 22px** — yes, even in a sidebar. That's the trick.
- Right-aligned `meta` (e.g. `1/4`) in mono 11px @ 60% lime.
- Optional red `badge` (`#FF3B1A`) for counts like "2 new synergies."

### Tutorial sticker (bottom of nav)
- Pinned to bottom via `margin-top: auto`.
- 3px lime top border, dual buttons: ghost outline + lime-fill primary.

### Stat cards (Click Power / Combo)
- 3px lime border, big `Archivo Black` number (36px), tiny mono label on the left, sub-text right-aligned.
- Combo card includes a 90×6 mini bar with 1.5px lime border and lime fill.

### The Factory (the violet stage)
- `--purple` fill, 3px lime border (in the live build the inner border is removed because the frame already provides it).
- **Corner stamps:** the four shapes (square/circle/cross/triangle) at 96px, opacity 0.16, rotated -12°/+8°/+14°/-6°, color-shifted dark via CSS `filter` to sit underneath the slots without competing.
- **Floats:** four `Caveat` "+4 / +1" numbers in off-white, scattered at different sizes (28–64px) and rotations (±8°), opacity 0.5–0.7 so they layer like graffiti.
- **Slots:** flex row, gap 22px.
  - **Active slot:** 128×128 paper-white tile, 4px black border, hard 6/6/0 black shadow.
  - **Buy slots:** 90×90 dashed paper-white border on `--purple-dark` fill, with the locked shape inside at 70% opacity.
  - **Locked slot:** solid border in `--purple-dark` on `--purple-deep` fill, lock icon at 55% opacity, mono "LVL 3" caption.

### Slim strip below factory
- 3px lime border, 10×16 padding.
- Left: count + faint hint text in 11px muted lime.
- Right: lime-fill mono CTA button.

### Right rail — "Almost There."
- Tag chip (`⚑ ALMOST`) in lime + black, immediately followed by the Playfair italic title `There.` (note the period — every section title ends in a period).
- Each row: label + percent on one line, 6px progress bar with 1.5px lime border, sub-line below with optional inline `BUY` button.

### Right rail — "Live Feed."
- Same head pattern. Lines are mono 12px:
  - timestamp (40% lime) · event (lime) · optional right-aligned tag chip.
  - Combo events get color `#FF6B3D` and weight 900.

### Footer band
- Full-width lime fill, black ink.
- Left cap: black box with lime "STATS" Playfair italic.
- Center: 9-column grid of mini-stats. Each cell = mono 10px label / Archivo Black 18px value, divided by 1.5px dashed black-25% verticals.
- Right cap: black box with lime "CREATED BY MATES" mono caption.

---

## 4. The boss sequence (the centerpiece)

A multi-stage cinematic that promotes the rail's quiet "BOSS / INCOMING" card into a full-frame takeover. Total duration ≈ 12s from idle to fight-ready.

### Stage 0 — Idle rail card (always visible)
- Dark violet `#1a0030` background, 10px barber-pole stripes top edge (45° lime/black 12px repeats).
- "BOSS" in lime Playfair italic, "INCOMING" same family at 45% white opacity.
- Boss artwork sits bottom-right at 120px wide with the lime drop-shadow glow.
- `Archivo Black` countdown timer in lime.

### Stage 1 — Card escalates (5 → 0 seconds)
The same card transitions through three states as the timer ticks down:
| State | Trigger | Background | Stripes | Title accent | Timer |
|---|---|---|---|---|---|
| `.boss` | t > 5 | `#1a0030` | static lime/black | lime "BOSS" | lime |
| `.boss.warn` | 5 ≥ t > 3 | `#3a0010` | static lime/black | lime "BOSS" | `#FFB13D` orange |
| `.boss.imminent` | t ≤ 3 | pulsing `#5a0014 → #a50018`, 0.5s alternate | red/black, sliding 0.35s linear | red `#FF3B1A` "BOSS", word becomes "IMMINENT" | red, `tickPop` 0.5s scale 1 → 1.18 |

### Stage 2 — Takeover lifts (0 sec, ~3.7s total)
A `.boss-takeover` overlay covers the whole 1280×820 frame at `z-index: 100`. It composes four layered effects:

1. **Vignette** — radial gradient, dark center to deep red edges (`rgba(40,0,0,0.92)` → `rgba(80,0,10,0.97)`). Fades in at `0.25s`.
2. **Scanlines** — `repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0 1px, transparent 1px 4px)` with `mix-blend-mode: overlay`. Fades in alongside vignette.
3. **Hazard stripes top + bottom** — 18px tall red/black 45° stripes. `scaleY(0)` → `scaleY(1)` over 0.3s, then `background-position` slides 72px every 0.6s for the conveyor effect.
4. **Countdown stage** — centered `display: grid`.

### Stage 3 — The 3-2-1 (3 beats × 0.9s)
Each digit appears in sequence: **3** → **2** → **1**.
- **Digit:** `Archivo Black` 340px, white fill, 6px black `-webkit-text-stroke`, 8/8/0 black shadow, letter-spacing -0.04em.
- **Animation `countPulse` (1s ease-out):**
  - 0% — `scale(0.4) rotate(-6deg)`, opacity 0, `blur(8px)`
  - 20% — `scale(1.25) rotate(2deg)`, opacity 1, no blur (the SLAM)
  - 70% — `scale(1) rotate(0)`, opacity 1
  - 100% — `scale(1.4)`, opacity 0, `blur(2px)` (fades out swelling)
- **Tag at 14% from top:** `⚠ INCOMING ⚠` in mono 18px @ 0.4em letter-spacing, red borders top + bottom, semi-transparent black background.
- **Sub at 16% from bottom:** `SQUARE BOSS APPROACHING` in mono 13px @ 0.3em letter-spacing, white at 55% opacity.
- **Expansion rings:** two centered absolute pseudo-elements that scale from 40px → 1100px and fade. Lime ring leads, red ring follows with 0.2s delay. Re-fired on each digit.

### Stage 4 — DEFEND! beat (0.9s)
- Same slot as the digits, but the number element switches to `.go`:
  - `Playfair Display` italic 900, **200px**, color `#FF3B1A`, 6/6/0 black shadow, no text-stroke.
  - Same `countPulse` animation — still the slam-and-blow-out feel, but the type changes character (numerals → italic display).

### Stage 5 — Boss reveal (the payoff)
- **White flash** — `.bt-flash` absolute white overlay animates 0 → 1 → 0 over 0.25s. Triggered the moment the boss stage swaps in.
- **Boss spawn shake** — the `.bt-boss-art-wrap` runs:
  - 0% — `scale(2.5) rotate(-15deg)`, opacity 0, `blur(12px)` (it's hurled at the camera)
  - 50% — `scale(0.85) rotate(4deg)` (overshoot bounce)
  - 70% — `scale(1.05) rotate(-2deg)` (tiny re-bounce)
  - 100% — settled
- **Idle float** kicks in after the shake: 2.4s ease-in-out alternate, ±10px Y, ±1° rotation.
- **Aura** — radial red glow blurred 20px behind the art, animating opacity 0.55 ↔ 1 every 1.4s.
- **Boss image filter** — `drop-shadow(0 0 24px rgba(255,59,26,0.6))` for the menacing red glow + `drop-shadow(8px 8px 0 black)` for the chunky offset.

### Stage 5 layout
A 3-row grid with 48px / 60px padding:
| Row | Content |
|---|---|
| Top | `⚠ BOSS ENCOUNTER` red tag (left) · `LVL.1 · WAVE 01 · TIMER 0:30` mono meta (right) |
| Middle | Centered boss artwork, 380×300 wrap |
| Bottom | Title (`SQUARE BOSS` — first word red, second white, 64px Playfair italic, 5/5/0 black shadow); HP bar; reward / penalty line + FLEE / FIGHT buttons |

**Corner stamps:** four mono 11px @ 0.2em labels at 30px inset — `▌ENC-001`, `SECTOR · 01`, `THREAT · A`, `⚠ DEFEND` — at 45% white opacity. Cheap arcade flair.

### HP bar
- 18px tall, 3px solid `#FF3B1A` border, `rgba(255,59,26,0.15)` background.
- Fill: 45° diagonal stripes alternating `#FF3B1A` and `#A8230E` every 8/16px (mirrors the level bar pattern, but red).
- 10 tick segments overlaid via flex spans with 1px black-35% right-borders.
- Width animates 0.4s ease-out on damage.
- Number display: `Archivo Black` 22px, tabular-nums, right-aligned, min-width 96px.

### Action row
- **Reward line:** mono 12px @ 0.16em — `REWARD: +250 IGH · +1 DC` in lime, then `PENALTY: −ALL IGH` in red.
- **FIGHT button:** red `#FF3B1A` fill, paper text, 3px black border, 5/5/0 black shadow, `Archivo Black` 22px @ 0.06em. Hover lifts -2px/-2px (shadow → 7/7/0). Click sinks 2px/2px (shadow → 2/2/0).
- **FLEE button:** transparent, 2px white-40% border, white-55% mono 12px text. Closes overlay.

### Damage feedback
- Each FIGHT click: HP -50, white flash (0.25s), HP bar width tweens to new percent.
- HP at 0 → auto-close after 350ms.

---

## 5. Interaction notes

- **Click the factory →** spawns a Caveat "+N" float at cursor that drifts up 80px and fades over 720ms, plus a 140ms 4-keyframe shake on the factory (`±2px` translate). The whole feel of the game lives in this micro-feedback — keep timing tight.
- **Boss timeline:** card escalates 8s → takeover starts → 3 (0.9s) → 2 (0.9s) → 1 (0.9s) → DEFEND! (1.0s) → reveal. Tweak the lead-in length per encounter difficulty, but don't shorten the 3-2-1 beats — under 0.9s each they read as a blur instead of a chant.
- **Numbers tick up** in the header / footer in response to clicks. Every `Archivo Black` number is a candidate slot for a tweening counter.
- **Combo bar** decays on a timer; resetting the bar resets `×3` back to `×1`.
- **Nav active state** swaps fill/ink — there's no transition; it should snap.

---

## 6. Asset inventory

All in `assets/` next to the HTML:

| File | Used for |
|---|---|
| `Square.svg`, `Circle.svg`, `Cross.svg`, `Triangle.svg` | Slot tiles + corner stamps |
| `SquareSlot.svg`, `CircleSlot.svg`, `CrossSlot.svg`, `TriangleSlot.svg` | (Spare) outline variants |
| `bossSquare.svg` | Boss block artwork — chunky chalk-drawn square with angry eyes |
| `bossCircle.svg`, `bossCross.svg`, `bossTriangle.svg` | (Available) variants for other boss types |
| `factory-building.svg` | Nav icon next to FACTORY |
| `lock-alert.svg` | Locked slot icon |
| `Menu.svg` | (Spare) hamburger |

The corner stamps re-use the four shape SVGs with a CSS `filter` to recolor them into dark violet — no separate dark variants needed.

---

## 7. Porting cheatsheet

**To React/Tailwind:** the whole thing is seven components — `<Header>`, `<Nav>`, `<StatRow>`, `<Factory>`, `<Strip>`, `<Rail>`, `<Footer>`, plus `<BossTakeover>` as a portal. The shape-stamping in the factory is just four absolutely-positioned `<img>` tags. Keep the exact pixel sizes; arbitrary values (`w-[1280px]`) are fine. The boss takeover is best modelled as a state machine (`idle → warn → imminent → countdown:3 → countdown:2 → countdown:1 → defend → reveal → fight → done`) driven by a single timer.

**To Unity UI Toolkit:** Map the lime-on-black borders to a single `border-3` USS class. Use a 9-slice stripe texture for the level-bar fill instead of repeating-linear-gradient. The "+N" floats are a particle-style spawner. The boss takeover wants a dedicated UIDocument layered on top of the game UI, with a Coroutine driving the countdown beats.

**To Figma:** Build as one frame `1280×820`, four auto-layout columns (header / nav / center / rail) plus footer. Each section type (stat card, slot tile, almost-row) becomes a component with variants for its states (active / buy / locked / muted nav, etc). Mock the boss takeover as a separate frame with the same dimensions, and use Smart Animate between countdown digits if you want to demo the motion.

**Direction-defining details (don't drop these):**
1. The 3px lime border running everywhere.
2. Playfair italic next to JetBrains Mono — never separate them.
3. Hard 6/6/0 (or 5/5/0 / 8/8/0) shadows, never soft.
4. Section titles ending in `.` — "There.", "Feed.", "Selecting Slots."
5. Caveat handwritten floats inside the violet stage.
6. The barber-pole stripes on top of the boss block — green by default, switch to **red** in the imminent / takeover states.
7. The 3-2-1 countdown digits use `Archivo Black` with a black text-stroke; the **DEFEND!** beat switches to `Playfair italic` red — type-character is a payoff, not a constant.
8. Boss reveal flash is *white* and fast (250ms). Don't make it red — the contrast with the surrounding red vignette is what sells the impact.

Lose any one of those and it stops feeling like the same screen.
