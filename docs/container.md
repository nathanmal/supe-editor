# Container Block — Plan

**Status:** Phases 1 (layout + colors) and 2 (responsive layout, gap, min
height) done 2026-11-27. Next: phase 3 (image background + overlay). Update
this doc as phases land (and log them in `PROGRESS.md`).

**Depends on:** [`responsive-supports.md`](responsive-supports.md) phases 1–4
(done); this plan adds two supports to it (its phase 8, "more supports").
Uses [`fader.md`](fader.md) as a background.

`supe-container/container` grows from an empty wrapper into the package's
general **layout block**: flow / constrained / flex / grid layout, text and
background color, responsive spacing, gap, layout overrides and min height —
plus an optional **background layer** (image, looping video, or a block such
as the Fader) under an overlay, like core's Cover. Every extra is opt-in: a
Container with nothing set renders exactly as today.

---

## Decisions

| Topic | Decision |
|---|---|
| One block | Layout and background both live on Container — no separate cover-like block |
| Name | Stays `supe-container/container` (saved content references it) |
| Layout type | Core `layout` support (flow / constrained / flex / grid), so theme.json content/wide sizes and `alignwide`/`alignfull` children work as in Group |
| Responsive layout | New `supe.layout` support: direction, justify, align (flex only) and one gap value (replaces core `blockGap`), desktop default + tablet/mobile overrides, one panel. The desktop direction is core's `layout.orientation` (shown and edited in the same panel), so variations, movers and drop indicators keep working. Core's orientation/justification/vertical-alignment controls are turned off on Container; core keeps the layout type, content widths, wrap and grid settings |
| Scope | Build only what gives clear value; anything else stays core (wrap and grid columns aren't responsive in v1) |
| Min height | New responsive `supe.dimensions` support (`minHeight`), replacing core `dimensions.minHeight` |
| Spacing | `supe.spacing` (already on) |
| Colors | Core `color`: text, background, gradient, link — set by the user, no automatic light/dark detection |
| Background | Optional child block `supe/container-background`, always the Container's first child, absolutely filling it under the content |
| Background types | Image, video, block (`supe/fader` only for now; Slides left out on purpose, maybe later) |
| Overlay | Belongs to the background block: color or gradient + opacity; no overlay without a background |
| Container markup | `save()` unchanged; the background frame is pure CSS (`:has(> .wp-block-supe-container-background)`), layout classes are added at render time by core |
| Background rendering | Dynamic (`render.php`), so its markup can change without validation errors |
| Editor | All settings in the sidebar; the canvas shows the design. Fader keeps its own empty-state prompt |
| Video motion | No `autoplay` attribute; a view script plays it (muted, loop, inline) when motion is allowed and it's on screen. Reduced motion or no script → poster. A pause button is not added (opt-in later, if ever) |

---

## Layout

`block.json` uses core layout with Group's setup:

```json
"layout": {
  "allowSizingOnChildren": true,
  "allowOrientation": false,
  "allowJustification": false,
  "allowVerticalAlignment": false
}
```

No `allowSwitching`: like Group, the type is changed through the
variations (sidebar switcher / toolbar transforms). The `allow*: false`
flags (phase 2) hide core's flex controls in the sidebar and toolbar, so
direction and alignment have one home, the Responsive layout panel. Core
still writes `display: flex`, the orientation (`is-vertical`), its wrap
toggle (the one control left in its Layout panel; it can't be hidden) and
its defaults (row: `align-items: center`; vertical: `flex-start`); the
support's `!important` rules override them.

- **No `default.type` change for existing content:** without a stored
  `layout`, the Container is `flow` and matches no variation. Page 27 (the
  saved Container on supe.test) stays valid and renders with
  `is-layout-flow` (checked 2026-11-26).
- **Variations** (`blocks/container/variations.js`, like Group's):
  *Container* (constrained, `isDefault`) is the only one in the inserter;
  *Row* (flex, nowrap), *Stack* (flex vertical) and *Grid* are `block` +
  `transform` scope only — in the inserter they sat next to Group's Row /
  Stack / Grid with the same names and icons. Stack keeps core's
  `orientation: vertical` (the desktop direction); phase 3 adds
  *Hero* (constrained, min height 60vh, image background with a 50% black
  overlay, white text). No variation picker in the canvas — the "+"
  appender stays the empty state.
- **Content position:** no own control (2026-11-26). A flex Stack places
  the content (and with `supe.layout` can do it per viewport); revisit only
  if testing in the editor shows it's needed.
- **Colors:** core `color` (text, background, gradient, link; text and
  background shown by default) — classes/inline styles in the saved markup
  only when set.

### `supe.layout` (responsive flex + gap)

Same model as responsive spacing: desktop is the default, tablet and mobile
store only what they override, one viewport switcher in the panel.

```json
"supe": { "layout": {
  "v": 1,
  "gap":       { "desktop": "var:preset|spacing|40", "mobile": "var:preset|spacing|20" },
  "direction": { "mobile": "column" },
  "justify":   { "desktop": "space-between", "mobile": "flex-start" },
  "align":     { "desktop": "center", "mobile": "stretch" }
} }
```

- **Desktop direction = core `layout.orientation`.** The panel shows it as
  the Desktop value of Direction and writes it back to `layout`
  (`vertical`, or unset for row), so the Row / Stack variations, block
  movers and drop indicators follow it. Only tablet/mobile directions are
  stored in the support (a stored desktop one would still render, but the
  panel never writes it). Panels get the block's `attributes` /
  `setAttributes` for this (`registerSupport()`).

- **Stored in CSS terms** (`justify` = `justify-content`, main axis;
  `align` = `align-items`, cross axis), not core's "justification" — core
  swaps which CSS property that means when the orientation is vertical, and
  with direction changing per viewport that would make one value mean
  different things on different screens. The Justify / Align icons and
  labels follow the direction in effect at the selected viewport (row:
  Left…Right for Justify, Top…Bottom for Align; column: the other way
  round). Clicking the selected option clears it.
- `gap`: **one value** for row and column gap, all viewports; `replaces`
  core `spacing.blockGap`. Flex/grid: `gap` (`!important`). Flow /
  constrained: the children's `margin-block-start` from the second child
  on (`.has-supe-g.is-layout-flow>*+*`), **not** `!important`, so a child's
  own inline margin still wins, as with core's block gap. `layout` loads
  before `spacing`, so a child's responsive margin comes later in the
  stylesheet too.
- `direction` / `justify` / `align` rules are scoped to `.is-layout-flex`,
  and the panel hides them for other layout types, so values left over
  from a Row/Stack do nothing in a Grid.
- **New in the framework** (`responsive-supports.md`): a `keyword` value
  type (`{ "type": "keyword", "values": [ … ] }`) in `ValueSanitizer` +
  `sanitize.js`; property `type` can be an options object; a property can
  have several `rules` (`css`, a `selector` suffix, `important`) instead of
  one `css`. The rest — sparse viewport values, inline variables,
  generated media queries, versioning, canvas preview — is the existing
  spacing machinery.
- Not in v1: responsive wrap, grid columns, child `order` (ROADMAP
  "Responsive layout"). Core's grid with a minimum column width already
  reflows on its own.
- Generic: Group could opt in with the phase-5 core bridge later; v1 opts in
  Container only.

### `supe.dimensions`

```json
"supe": { "dimensions": { "v": 1, "minHeight": { "desktop": "60vh", "mobile": "0" } } }
```

Sanitized as `spacing` (`0`, px / em / rem / % / vh / vw, or a spacing
preset; `length` only allows px / % / vh, which the slider relies on). `0`
drops an inherited min height on a smaller viewport. `replaces` core
`dimensions.minHeight`. Panel: one `UnitControl` (px, vh, vw, rem, em, %)
with the inherited value as placeholder. The Fader could opt in later
instead of core's.

Both supports follow `responsive-supports.md`'s recipe: `support.json`
(`"version": 1`) + `support.php`, `index.js` + `Panel`, fixtures in
`tests/fixtures/supports/{layout,dimensions}.json` run by PHPUnit and Jest.

---

## Background

```
supe-container/container
 ├─ supe/container-background   ← first child, parent: Container only, inserter: false
 │    type: image | video | block
 │    image:  mediaId, focalPoint
 │    video:  mediaId, posterId, focalPoint
 │    block:  one inner block (allowedBlocks: supe/fader)
 │    overlay: { color | gradient, opacity 0–100 (default 50) }
 └─ …content blocks
```

### Front end

- `.wp-block-supe-container-background` (the selector Container's CSS keys
  on): `position: absolute; inset: 0; z-index: -1; overflow: hidden`, with
  `border-radius: inherit`. The Container, via `:has()`, gets
  `position: relative; isolation: isolate` so the background stays inside
  it and under its content, whatever the layout type.
- Media: `object-fit: cover`, focal point → `object-position`. Images via
  `wp_get_attachment_image( 'full' )` (srcset; `sizes="100vw"` when the
  Container is full width). Video: `<video muted loop playsinline
  preload="metadata" poster>` + script module `view.js`.
- Overlay: `::after` of the background (`opacity` from the setting,
  color/gradient as preset vars or custom values, sanitized).
- Fader in the slot: a rule makes it fill the layer
  (`height: 100%`, its aspect ratio / min height ignored) — the Container's
  min height and content decide the size.
- Being absolute, the background takes no part in flex/grid flow or gap. The
  one leak is flow/constrained spacing: the first content block follows the
  background, so it would get the block-gap top margin —
  `.wp-block-supe-container-background + * { margin-block-start: 0 }`.
- Empty background (no media chosen, empty fader) renders nothing; the
  Container then looks as it would without one.

### Editor

**The background is its own block type, not "whatever comes first".**
Anything dropped into a Container is content, the first block included.
`supe/container-background` is hidden from the inserter and can only live in
a Container, so the only way to get one is the Background panel. Being first
in the order just keeps List View and the CSS predictable.

Workflow:

1. Select the Container → sidebar **Background** panel, which shows
   "None" by default.
2. Pick **Image**, **Video** or **Fader**. The background block is inserted
   at index 0, and for image/video the media modal opens straight away.
   Fader shows its own "Choose the images…" placeholder in the layer.
3. The overlay controls (color/gradient, opacity) appear in the background
   block's sidebar, which is selected after insert. Text color is set on
   the Container.
4. To change the type, pick another one in the panel (it replaces the
   background after a confirm if it has content); **None** removes it the
   same way.

- The background is locked against moving; Container's edit puts it back
  first if content is dragged above it.
- Image/video open the media modal straight away; Fader shows its own
  placeholder in the layer.
- Background block sidebar: media (replace, focal point), poster for video,
  overlay (core `PanelColorGradientSettings` + opacity `RangeControl`). The
  Container's panel has "Edit background" (selects it); the background has a
  "Select container" icon (`blocks/shared/SelectParentButton`).
- In the canvas the layer sits under the content like the front end; it's
  selected from List View or those buttons, since the content covers it.

---

### Parallax (planned, not in the first phases)

An optional `motion` setting on image backgrounds: `none` (default) /
`fixed` / `parallax`.

- `fixed`: the image stays put while the page scrolls (Cover's "Fixed
  background"). With an `<img>` that's `position: fixed` inside a
  `clip-path: inset(0)` layer, not `background-attachment: fixed` (which
  iOS ignores and which loses srcset).
- `parallax`: the image moves slower than the page — the layer is taller
  than the Container and a view script translates it from the scroll
  position (`requestAnimationFrame`, only while on screen), or CSS
  scroll-driven animations (`animation-timeline: view()`) where supported,
  with the script as fallback.
- Both off under reduced motion (falls back to `none`). Video and Fader
  backgrounds stay `none` at first.
- Leave room for it now: the image is wrapped in the layer (not the layer
  itself), so moving it later doesn't change the markup's structure.

## Phases

1. ✅ **Layout + colors** — core `layout` and `color` supports on Container,
   variations, Container's saved markup unchanged (page 27 valid).
   `tests/Feature/ContainerTest.php`.
2. ✅ **Responsive supports** — `supe.dimensions` (min height) and
   `supe.layout` (gap, direction, justify, align; keyword value type), with
   fixtures (PHP/JS parity), panels, canvas preview. Opted in on Container;
   core's flex controls turned off there.
3. **Background: image + overlay** — `supe/container-background`, the
   Background panel, frame CSS, focal point, overlay. Hero variation.
4. **Background: video** — poster, view script (reduced motion, off-screen
   pause, hidden tab).
5. **Background: Fader** — block type, fill rule, Fader inside a Container
   with responsive min height.
6. *Later:* fixed / parallax image backgrounds (see above).

## Open Questions

- Which other blocks become background types later (Slides was deliberately
  left out on 2026-11-26).

Settled 2026-11-26: core layout for the type and widths; gap is one value;
responsive flex lives in `supe.layout` for all viewports; parallax planned,
built later; no content position control unless testing shows it's needed.
