# Container Block — Plan

**Status:** Phases 1 (layout + colors), 2 (responsive layout, gap, min
height), 3 (image background + overlay, Hero) and 4 (video background)
done 2026-11-27. Next: phase 5 (Fader as a background). Update this doc as phases land (and log them in
`PROGRESS.md`).

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
  `orientation: vertical` (the desktop direction). *Hero* (phase 3,
  inserter only, no `isActive` — once inserted it's a Stack): full width,
  Stack with content centered (`supe.layout` justify center), min height
  60vh, padding 60 / 40 presets, white text, a background with a 50%
  black overlay and no image yet (chosen from its toolbar), an empty
  heading and paragraph. No variation picker in the canvas — the "+"
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
 ├─ supe/container-background   ← first child, parent: Container only, inserter: false, lock: { move }
 │    type: image (phase 3) | video (phase 4) | block   ("enum" grows with each phase)
 │    image:  mediaId, focalPoint
 │    video:  mediaId, posterId, focalPoint, pauseButton
 │    block:  one inner block (allowedBlocks: supe/fader)
 │    overlayColor, overlayGradient   ← `var:preset|color|slug` / `var:preset|gradient|slug` or a custom value
 │    overlayOpacity                  ← 0–100, default 50
 └─ …content blocks
```

`Supe\Editor\Blocks\ContainerBackground::overlay()` turns the overlay
attributes into declarations (preset → `var(--wp--preset--…)`, custom values
only if they look like a hex/rgb/hsl color or a CSS gradient — no `url`, no
`;`; a gradient wins over a color; no color/gradient → no overlay);
`blocks/container-background/overlay.js` mirrors it for the editor, both
running `tests/fixtures/container-background.json`.

### Front end

Markup (`render.php`):

```html
<div class="wp-block-supe-container-background is-image">
  <div class="wp-block-supe-container-background__media" aria-hidden="true"><img alt="" sizes="100vw" srcset="…" style="object-position:20% 80%"></div>
  <span class="wp-block-supe-container-background__overlay" style="background-color:var(--wp--preset--color--contrast);opacity:0.7" aria-hidden="true"></span>
</div>

<div class="wp-block-supe-container-background is-video">
  <div class="wp-block-supe-container-background__media" aria-hidden="true"><video class="wp-block-supe-container-background__video" src="…" poster="…" muted loop playsinline preload="metadata" disablepictureinpicture disableremoteplayback></video></div>
  <span class="wp-block-supe-container-background__overlay" …></span>
  <button type="button" class="wp-block-supe-container-background__pause" aria-label="Pause background video" data-label-play="Play background video" hidden>…pause / play icons…</button>
</div>
```

- All the CSS is the background block's `style.scss` (the Container has
  none, and it only loads where a background renders).
  `.wp-block-supe-container-container:has(> .wp-block-supe-container-background)`
  gets `position: relative; isolation: isolate`; the background is
  `position: absolute; inset: 0; overflow: hidden; border-radius: inherit;
  pointer-events: none`, with `max-width: none` and `margin: 0` against
  constrained layouts' child rules. It has no z-index of its own (phase 4):
  its media and overlay are `z-index: -1` (under the content, over the
  Container's own background color) and a video's pause button `z-index: 1`
  (over the content, clickable). So it fills the padding box whatever the
  layout type.
- Media: `object-fit: cover`, focal point → `object-position`
  (`Slides\Markup::objectPosition()`), `wp_get_attachment_image( 'full' )`
  with `sizes="100vw"` and an empty alt (decorative; the media and overlay
  are `aria-hidden`, not the wrapper, so the pause button stays reachable).
- Video (phase 4): media library uploads only (no YouTube/Vimeo — they
  can't be reliably muted, looped or paused off screen). No `autoplay` in
  the markup: `view.js` (a script module) plays it while it's on screen in
  a visible tab, unless the visitor prefers reduced motion (then it stays
  on its poster, or the first frame) or paused it; if the browser refuses
  to play (power saving) it stays paused and the button offers Play. Poster
  optional (`posterId`, must be an image). Plays on phones too.
- Pause button (opt-in, `pauseButton`): bottom-right, `hidden` until
  `view.js` runs, label switches Pause / Play background video, icons from
  the slider's `icons.json` (`Controls::icon( name, class )`). Themeable
  with `--supe-container-background-control-background` / `-color`. Under
  reduced motion it shows Play, so visitors can still start the video.
- The view module is only enqueued for videos: core enqueues a block's
  `viewScriptModule` whenever it renders, so `BlockRegistrar::ON_DEMAND_MODULES`
  drops it from the block's settings (it stays registered) and render.php
  calls `wp_enqueue_script_module( ContainerBackground::VIEW_MODULE )`.
- Overlay: a `<span>` after the media (not `::after`: inline styles carry
  the per-block color and opacity).
- Fader in the slot: a rule makes it fill the layer
  (`height: 100%`, its aspect ratio / min height ignored) — the Container's
  min height and content decide the size.
- Being absolute, the background takes no part in flex/grid flow or gap. The
  one leak is flow/constrained spacing: the first content block follows the
  background, so it would get the block-gap top margin —
  `.wp-block-supe-container-container > .wp-block-supe-container-background + :not(…)`
  sets it to 0 (three classes, so it beats `.has-supe-g.is-layout-flow>*+*`
  without `!important`).
- Empty background (no media chosen, empty fader) renders nothing; the
  Container then looks as it would without one.

### Editor

**The background is its own block type, not "whatever comes first".**
Anything dropped into a Container is content, the first block included.
`supe/container-background` is hidden from the inserter and can only live in
a Container, so the only way to get one is the Background panel. Being first
in the order just keeps List View and the CSS predictable.

Workflow (as built in phase 3, `blocks/container/BackgroundPanel.js`):

1. Select the Container → sidebar **Background** panel: "None", **Add
   image** and **Add video** (phase 5 adds Add fader).
2. Each opens the media modal for its kind; picking one inserts the
   background block at index 0 (`lock: { move: true }`, `type` set) and
   selects it. Cancelling adds nothing. The type stays: to switch, remove
   and add again (Replace picks the same kind).
3. The background's sidebar has **Image** (focal point + reset) and
   **Overlay** (a core-style tools panel: color/gradient dropdown, opacity
   0–100 in steps of 5, disabled until there's a color or gradient) — a
   video has **Video** instead of Image (focal point over a video preview,
   poster image choose / replace / remove, Pause button toggle) — plus a
   "Select container" icon (`blocks/shared/SelectParentButton`). Replace /
   Choose image is in the toolbar (`MediaReplaceFlow`). Text color is set
   on the Container.
4. With a background, the Container's panel shows its thumbnail (a video's
   poster, else a video icon), **Edit background** (selects it) and
   **Remove** (after a confirm).
5. The canvas plays the video (muted, looping; not with reduced motion)
   and shows the pause button where it'll be.

- Picked theme colors / gradients are stored as preset references
  (`toStored()` / `fromStored()` in `overlay.js`).
- Container's edit moves anything dragged above the background back below
  it (`moveBlocksToPosition( …, 1 )` on the blocks before it — the
  background itself is locked); the "+" appender counts content only.
- In the canvas the layer sits under the content like the front end
  (`pointer-events: none`), so it's selected from List View, the
  Container's panel, or the breadcrumb. Without an image it shows a light
  `currentcolor` fill (editor only) under its overlay.
- **Gotcha:** `ColorGradientSettingsDropdown` always wraps itself in a
  `ToolsPanelItem`, which renders nothing outside a `ToolsPanel` — hence
  the Overlay tools panel instead of a `PanelBody`.
- A Container with a background and no content has no height (the layer
  sizes to the content). In the editor it gets `is-background-only`: a
  300px placeholder height and the "+" centered over the image, since
  core only centers the appender while it's the only child. Adding a
  background also sets the Container's min height to 400px (desktop, like
  Cover) when none is set at any viewport, in the same undo step; the
  placeholder covers the case where it's removed afterwards.

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
3. ✅ **Background: image + overlay** — `supe/container-background`, the
   Background panel, frame CSS, focal point, overlay. Hero variation.
4. ✅ **Background: video** — poster, view script (reduced motion, off-screen
   pause, hidden tab), opt-in pause button, view module only for videos.
5. **Background: Fader** — block type, fill rule, Fader inside a Container
   with responsive min height.
6. *Later:* fixed / parallax image backgrounds (see above).

## Open Questions

- Which other blocks become background types later (Slides was deliberately
  left out on 2026-11-26).

Settled 2026-11-26: core layout for the type and widths; gap is one value;
responsive flex lives in `supe.layout` for all viewports; parallax planned,
built later; no content position control unless testing shows it's needed.
