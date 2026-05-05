# George Droys — Game UI Design Spec

A replication guide for the hi-fi clicker UI. Use this to rebuild the screen in a different stack (React, Vue, Unity UI Toolkit, Figma, etc).

---

## 1. Visual identity

**Genre cue:** y2k arcade / brutalist clicker. Hard black backdrop, neon-lime accent, one violet "stage" panel that holds the actual gameplay, italic display serif against a chunky industrial mono.

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
| Boss bg | `#1a0030` | Right-rail boss block |
| Combo orange | `#FF6B3D` | Combo line in live feed |
| Badge red | `#FF3B1A` | Synergies "2" badge in nav |

**Rule of three:** Black for chrome, lime for value, violet for stage. Never paint chrome violet or stage black — the contrast between the three zones is what makes it read as a "machine inside a frame."

### Type stack
| Family | Where | Why |
|---|---|---|
| **Playfair Display** italic 900 | "FACTORY", "There.", "Feed.", "STATS", "BOSS" | The romantic counterpoint to all the brutalism. Always italic, always heavy. |
| **Archivo Black** | Logo, large numerics (`4`, `×3`, `1`), footer values | Display weight for hero numbers. |
| **JetBrains Mono** 700/800 | All small labels, codes (`IGH`, `DC`, `PP`), buttons, feed timestamps | Adds the "terminal / cartridge readout" feel. Letter-spacing 0.10–0.18em. |
| **Caveat** 700 | The handwritten `+4 / +1` damage floats | Human noise inside the machine. |

Pair only these four. If you swap, keep the archetypes: serif-italic display + heavy sans display + industrial mono + handwritten.

### Borders & strokes
- **Every panel border = 3px solid `--green`.** This is the single most important rule. The whole UI reads as a circuit board because of it.
- Inner dividers in the footer = `1.5px dashed rgba(0,0,0,0.25)`.
- Active tile = `4px solid black` + `6px 6px 0 0 black` hard drop shadow (no blur).
- Locked / buy slots = `3px dashed --paper` on violet fill.
- **Never use border-radius.** Everything is square. Buttons, tiles, badges, bars — all sharp corners.

### Shadows
- Only **hard offset shadows** (e.g. `6px 6px 0 0 #000`). No soft gaussian blur anywhere except the boss-art glow (`drop-shadow(0 0 12px rgba(197,255,0,0.25))`).

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
│              │                         │  BOSS     │
├──────────────┴─────────────────────────┴───────────┤
│ FOOTER (lime band · 9 mini-stats · "by mates")     │
└────────────────────────────────────────────────────┘
```

- **Frame:** `1280 × 820`, fixed pixel size, centered on page. The whole thing is bordered by 3px lime — like a cartridge label.
- **Grid:** `grid-template-columns: 1fr 320px` for the body row; `auto 1fr auto` for header/body/footer.
- **Nav width:** 240. **Rail width:** 320. These ratios matter — the center panel is the visual hero.

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
  - **Active slot:** 128×128 paper-white tile, 4px black border, hard 6/6/0 black shadow. Optional black ribbon tag pinned to the top edge.
  - **Buy slots:** 90×90 dashed paper-white border on `--purple-dark` fill, with the locked shape inside at 70% opacity, plus a black-fill / lime-text "BUY · 200 IGH" tab below.
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

### Boss block
- Dark violet `#1a0030` background, 10px barber-pole stripes across the top edge (45° lime/black 12px repeats).
- "BOSS" in lime Playfair italic, "INCOMING" same family at 45% white opacity.
- Boss artwork sits bottom-right at 120px wide with the lime drop-shadow glow.
- Big `Archivo Black` countdown in lime.

### Footer band
- Full-width lime fill, black ink.
- Left cap: black box with lime "STATS" Playfair italic.
- Center: 9-column grid of mini-stats. Each cell = mono 10px label / Archivo Black 18px value, divided by 1.5px dashed black-25% verticals.
- Right cap: black box with lime "CREATED BY MATES" mono caption.

---

## 4. Interaction notes

- **Click the factory →** spawns a Caveat "+N" float at cursor that drifts up 80px and fades over 720ms, plus a 140ms 4-keyframe shake on the factory itself (`±2px` translate). The whole feel of the game lives in this micro-feedback — keep the timing tight.
- **Numbers tick up** in the header / footer in response to clicks. The current build is static, but every `Archivo Black` number is a candidate slot for a tweening counter.
- **Combo bar** decays on a timer; resetting the bar resets `×3` back to `×1`.
- **Nav active state** swaps fill/ink — there's no transition; it should snap.

---

## 5. Asset inventory

All in `assets/` next to the HTML:

| File | Used for |
|---|---|
| `Square.svg`, `Circle.svg`, `Cross.svg`, `Triangle.svg` | Slot tiles + corner stamps |
| `SquareSlot.svg`, `CircleSlot.svg`, `CrossSlot.svg`, `TriangleSlot.svg` | (Spare) outline variants |
| `bossSquare.svg` | Boss block artwork |
| `factory-building.svg` | Nav icon next to FACTORY |
| `lock-alert.svg` | Locked slot icon |
| `Menu.svg` | (Spare) hamburger |

The corner stamps re-use the four shape SVGs with a CSS `filter` to recolor them into dark violet — no separate dark variants needed.

---

## 6. Porting cheatsheet

**To React/Tailwind:** the whole thing is six components — `<Header>`, `<Nav>`, `<StatRow>`, `<Factory>`, `<Strip>`, `<Rail>`, `<Footer>`. The shape-stamping in the factory is just four absolutely-positioned `<img>` tags. Keep the exact pixel sizes; arbitrary values (`w-[1280px]`) are fine.

**To Unity UI Toolkit:** Map the lime-on-black borders to a single `border-3` USS class. Use a 9-slice stripe texture for the level-bar fill instead of repeating-linear-gradient. The "+N" floats are a particle-style spawner.

**To Figma:** Build as one frame `1280×820`, four auto-layout columns (header / nav / center / rail) plus footer. Each section type (stat card, slot tile, almost-row) becomes a component with variants for its states (active / buy / locked / muted nav, etc).

**Direction-defining details (don't drop these):**
1. The 3px lime border running everywhere.
2. Playfair italic next to JetBrains Mono — never separate them.
3. Hard 6/6/0 shadows, never soft.
4. Section titles ending in `.` — "There.", "Feed.", "Selecting Slots."
5. Caveat handwritten floats inside the violet stage.
6. The barber-pole stripes on top of the boss block.

Lose any one of those and it stops feeling like the same screen.
