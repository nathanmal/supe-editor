# Slides Block — Plan

**Status:** Phases 1–6 (structure, editing, layout, engine, controls, drag)
done 2026-11-26; phase 7 (lightbox) next.
Captures the design decisions made on 2026-11-04; update this doc as phases
land (and log them in `PROGRESS.md`).

**Depends on:** phase 1 of [`responsive-supports.md`](responsive-supports.md)
(breakpoints, value sanitizing, `ResponsiveControl`, and generated CSS for
**responsive variables**). Slides per view, gap, and height are all responsive.

A slideshow/carousel block (`supe/slides`) with three slide types — **images**,
**content**, and **posts** — plus autoplay, pluggable transitions, multi-slide
views, optional controls (overlay and/or below the slider), drag/swipe,
infinite loop, and a lightbox for image slides.

---

## Decisions

| Topic | Decision |
|---|---|
| Structure | Parent block + child blocks; every slide is a block |
| Slide types | Images, content, posts — picked via block variations on insert |
| Posts | Reuse core Query Loop (`core/query` + `core/post-template`), plus a "Selected posts" mode |
| Slide wrapper | Every slide carries `.supe-slides__slide`, regardless of type |
| Slide names | Optional per-slide name via core block renaming (`metadata.name`); used in the editor, List View, and accessible labels |
| Timing | One transition and delay for all slides — no per-slide overrides |
| Rendering | All blocks dynamic (`render.php`); `save()` returns only `<InnerBlocks.Content />` or `null` |
| No-JS fallback | Horizontal scroll-snap strip |
| Engine | Custom, with a transition registry; **no cloned slides** for looping |
| Transitions | `slide` (left / right / up / down) and `fade` initially; more added as files |
| Slides per view | "Columns" (horizontal) / "Rows" (vertical), **responsive** |
| Height | `px` / `%` / `vh` / `ratio` / `auto`, **responsive**; applies to the whole slider (default) or to each slide |
| Controls | Blocks, in an **overlay** area (3×3 grid over the track) and/or a **bar** below the slider — every control optional, pause included |
| Icons | Preset sets + SVG uploads (anyone with `upload_files`), sanitized on upload and on output, rendered inline |
| Image slides | Per-image fit, size, focal point, alt, caption, lightbox; parent-level defaults |
| Lightbox | Custom: one native `<dialog>` per slider, prev/next across its images |
| Ordering | Block-based (List View, movers) + drag-to-reorder in the sidebar slide list; posts via query order or "Selected posts" |
| Script | `viewScriptModule` (needs `--experimental-modules` on `wp-scripts`) |

---

## Block Structure

```
supe/slides                       ← settings: type, playback, transition, layout, interaction
 ├─ supe/slides-track             ← always present, locked (no move/remove)
 │    ├─ supe/slide               ← "content" type: InnerBlocks, like a Group
 │    ├─ supe/image-slide         ← "images" type: one image + settings
 │    └─ core/query               ← "posts" type: exactly one, locked structure
 │         └─ core/post-template
 ├─ supe/slides-overlay           ← optional: controls over the track
 │    └─ any of: prev, next, indicators, pause
 └─ supe/slides-bar               ← optional: controls below the slider
      └─ any of: prev, next, indicators, pause
```

- **Track vs. controls containers** keep slides and controls from mixing in
  one inner-block list — `allowedBlocks`, indicator counts, and List View all
  stay simple.
- The track's `allowedBlocks` depends on the parent's `type`:
  images → `supe/image-slide`; content → `supe/slide`; posts → one `core/query`.
- Each child block sets `"parent"` / `"ancestor"` so it can only be inserted in
  the right container.
- **`parent` beats `allowedBlocks`:** the editor allows an insertion when
  *either* the container's allowed list or the child's `parent` allows it, so
  the track's per-type `allowedBlocks` alone can't keep an image slide out of
  a content track. `blocks/slides-track/slide-blocks.js` vetoes it through
  core's `blockEditor.__unstableCanInsertBlockType` filter (core uses it to
  keep template parts out of post content). `ancestor` instead of `parent`
  would offer slide blocks inside every container nested in a content slide.
- At most one controls area per placement. The parent inspector's
  **Overlay controls** / **Controls below** toggles insert or remove the areas
  (in a fixed order: track, overlay, below); the editor enforces the
  one-per-placement rule.
- The parent passes settings down via block context (`providesContext`):
  `supe/slides/type`, `…/autoplay`, `…/navigable`, etc.

### Choosing the type

- The three types are **block variations** of `supe/slides` (`isActive` on the
  `type` attribute), so inserting the block shows a variation picker (like
  Columns).
- Changing type later (the sidebar's [Images | Content] toggle) replaces the
  track's contents — the editor asks for confirmation first.

### Slide wrapper class

- `supe/slide` and `supe/image-slide` output `.supe-slides__slide` from their
  own `render.php`.
- For posts, the parent's `render.php` adds `.supe-slides__slide` to each
  post `<li>` from `core/post-template`, using `WP_HTML_Tag_Processor`.
- The front-end engine only ever looks for `.supe-slides__slide`.

### Slide names

- Uses core block renaming: the name is stored in the `metadata.name`
  attribute every block already has (`supports.renaming` is on by default),
  so **List View rename works without extra code**. The slide inspector adds
  a "Slide name" field that edits the same value.
- Fallbacks when unnamed:
  - image slide → the image's alt text, then its media library title;
  - content slide → "Slide N";
  - post slide → the post title (read at render time).
- Where names appear:
  - the sidebar slide list and List View;
  - the slide's accessible label ("Slide 3 of 7: Summer collection");
  - indicator buttons' `aria-label` and `title` ("Go to slide: Summer collection").
- Names are never shown visually on the front end in v1. A "labels"
  indicator style (text tabs from slide names) would be a natural later
  addition.

---

## Slide Types

### Content slides (`supe/slide`)

- InnerBlocks, behaves like a Group: background color/image, colors,
  responsive spacing (`supe.spacing`), vertical content alignment (toolbar,
  `is-vertically-aligned-{top|center|bottom}`).
- The slide is a flex column so content can align vertically; layout is
  **flow only** (`allowSwitching`/`allowInheriting` off) because constrained
  layout's auto margins shrink flex items to their content. Put a Group inside
  for a content width.

### Image slides (`supe/image-slide`)

- **Adding:** "Add images" (parent toolbar and the sidebar slide list) and the empty
  image slide's placeholder open the media library's gallery flow (pick
  several, then reorder before insert); one `supe/image-slide` per image.
  The slide list/toolbar append; the placeholder fills its own slide and
  inserts the rest after it.
  - **Core bug worked around:** in the gallery flow `MediaUpload.openModal()`
    registers the frame's listeners a second time (WordPress 7.1), so
    `onSelect` fires twice per insert. `slides/shared/use-media-select.js`
    drops a same-tick repeat of the same selection.
- **Per-image settings** (size, fit and caption position fall back to the
  parent's `imageDefaults`, then `Markup::IMAGE_DEFAULTS` — large, cover,
  below; the selects show "Default (…)" naming the fallback):
  - image size (thumbnail, large, full, …)
  - fit: `cover` / `contain` / `fill` / `none` → `object-fit`
  - focal point (`FocalPointPicker`) → `object-position`
  - lightbox on/off (phase 7)
- Replacing the image resets focal point and alt override, and pre-fills the
  caption from the library only if the slide has none.
- Images fill their slide (flex column): slides stretch to the tallest one,
  so fit/focal point show even before phase 3's heights.
- **Alt text:** empty = use the media library's alt, resolved at render time
  (so library edits flow through); a per-slide value overrides it.
- **Caption:** RichText, pre-filled from the library caption on insert.
  Position: below, overlaid at the bottom, or hidden (also a parent
  default — added to `imageDefaults` beyond the original plan).
- **Link:** optional; mutually exclusive with lightbox on the same image.
- **Output:** `wp_get_attachment_image()` for `srcset`/`sizes`, keeping
  core's `attachment-{size} size-{size}` classes. Core's loading optimization
  already gives the first image `fetchpriority="high"` and lazy-loads the
  rest; revisit if the engine needs otherwise.

### Post slides (`core/query`)

- Inserted from a fixed template: `core/query` (pagination off) →
  `core/post-template`, structure locked; the post template's contents are
  freely editable (this is the per-post slide template). Query Loop's own UI
  covers post types, count, order, taxonomies, authors, and pattern selection.
- **"Selected posts" mode:** a searchable post picker with a sortable list in
  the inspector, applied via the `query_loop_block_query_vars` filter as
  `post__in` + `orderby: post__in`.
  - **Needs a spike:** the editor preview of Query Loop is built from REST
    requests and doesn't forward custom query keys by default. Making the
    preview respect "Selected posts" likely needs a `rest_{$post_type}_query`
    filter plus passing the IDs through; verify before committing to the UI.

---

## Parent Settings

```json
{
  "type": "images | content | posts",
  "autoplay": { "enabled": false, "delay": 5000, "pauseOnHover": true },
  "loop": false,
  "transition": { "name": "slide", "direction": "left", "duration": 500, "easing": "ease" },
  "step": "slide | page",
  "perView": { "desktop": 3, "tablet": 2, "mobile": 1 },
  "gap":     { "desktop": "var:preset|spacing|30" },
  "height": {
    "desktop": { "mode": "ratio", "value": "16/9" },
    "tablet":  { "mode": "vh",    "value": 60 },
    "mobile":  { "mode": "auto" }
  },
  "heightTarget": "slider | slide",
  "drag": { "touch": true, "mouse": false },
  "keyboard": true,
  "imageDefaults": { "size": "large", "fit": "cover", "lightbox": false }
}
```

Validated in PHP before being written to the wrapper as
`data-supe-slides='{…}'` (non-responsive values, phase 4) and as responsive
CSS variables (`perView`, `gap`, `height`). `heightTarget` is its own
attribute (not a key inside `height`) so `height` stays a plain responsive
value `ResponsiveControl` handles as-is; absent = `slider`.

**Layout (phase 3, done):** `Supe\Editor\Blocks\Slides\Layout` (container
`supe.editor.slides`) registers `--supe-slides-per-view` (int 1–12),
`-gap` (spacing), `-h` (length) and `-ar` (ratio) with `StyleGenerator` on
`init`; `render.php` writes the inline `-d/-t/-m` values and
`is-height-slide`. `blocks/slides/shared/layout.js` is the portable JS mirror
(editor preview, headless), and both run `tests/fixtures/slides-layout.json`.
The responsive-variable machinery itself is now ported too
(`supports/_framework/variables.js`, fixture
`tests/fixtures/responsive-variables.json`).

### Slides per view

- One setting, labelled **Columns** for left/right transitions and **Rows**
  for up/down (phase 3 ships "Columns" only — direction arrives with the
  engine in phase 4).
- Written as responsive variables; the resolved value is
  `--supe-slides-per-view`. **The engine reads it with `getComputedStyle()`**
  on `ResizeObserver` callbacks — JS never needs the breakpoint values.
- **Step:** move by one slide or by a page (`perView` slides).
- Constraints:
  - `fade` with `perView > 1` fades whole pages → step forced to `page`.
  - Loop requires `slideCount > perView`; otherwise navigation is disabled
    (and `navigable` context is false, so arrows/indicators hide).
  - Indicator count is recomputed whenever `perView` changes.

### Height

- Modes: `px`, `%`, `vh`, `ratio` (to width), `auto` (tallest slide).
- Resolved into two variables consumed as
  `height: var(--supe-slides-h, auto)` and
  `aspect-ratio: var(--supe-slides-ar, auto)`. **When a viewport switches
  mode, the other variable is written as `auto` explicitly**, so a desktop
  ratio can't combine with a mobile `vh` height.
- `%` only resolves when the slider's container has a definite height — the
  control shows a note when `%` is chosen.
- Track: `min-height: 0` so a ratio holds even when content is taller.
- **Target:**
  - `slider` (default): applies to the viewport; slides fill it
    (divided by rows for vertical).
  - `slide`: applies to each slide; the viewport's height derives from it.
    For horizontal this is plain CSS. For vertical, viewport height =
    `perView × slide height + gaps`: CSS `calc()` covers `px`/`vh`; for
    `ratio`, either container query units (`container-type: inline-size` on
    the root, slide height `calc(100cqw / ratio)`) or the engine measures the
    first slide. `auto` and `%` aren't offered for the `slide` target.
  - Per-slide CSS: the track uses `align-items: flex-start` (a stretched
    height overrides `aspect-ratio`), slides get `min-height: 0` and
    `overflow: hidden` so content can't grow them.

---

## Rendering

- **All blocks are dynamic.** `save()` returns `<InnerBlocks.Content />`
  (slides, track, controls, content slide) or `null` (image slide, control
  buttons). Markup can change later without block validation errors or
  deprecations.
- `supe/slides/render.php` outputs the root wrapper, config JSON, responsive
  variables, ARIA attributes, the lightbox `<dialog>` (if any image has
  lightbox enabled), and adds the slide class to post items.
- **No-JS fallback:** base CSS lays the track out as a horizontal scroll-snap
  strip, so all slides are reachable before/without the script. The engine
  adds `.is-initialized` and takes over.

---

## Front-End Engine

Custom, rather than Swiper/Splide (large, own markup/CSS) or Embla (small and
great at drag, but translate-based — fade is a plugin and custom effects
fight it). The pluggable-transitions requirement favors a registry.

**No clones.** Library loops usually clone slides; with content slides that
duplicates IDs, forms, embeds, and players. Instead each slide is positioned
individually relative to the active index — loop is index arithmetic, and
vertical uses the same code.

```
blocks/slides/engine/
  Slider.js          ← state (index, perView, step, loop wrap), go( to, direction ), events
  transitions/
    index.js         ← registry: registerTransition( name, impl )
    slide.js         ← directions: left/right/up/down, supportsDrag: true
    fade.js          ← supportsDrag: false
  autoplay.js        ← timer; pauses on hover, focus-within, interaction, hidden tab
  drag.js            ← Pointer Events (touch + mouse), axis from direction, velocity + distance threshold
  keyboard.js
  controls.js        ← binds [data-supe-slides-action] within the root; builds indicators
  lightbox.js
```

### Transitions

- Stored as `{ name, direction?, duration, easing }`.
- Each implementation declares `directions`, `supportsDrag`, and any options;
  the editor builds the Transition panel from the same registry metadata, so
  a new transition is one file + one registration.
- **Drag** is only enabled when the transition supports it, on its axis.
  Touch and mouse are separate toggles. A drag past the threshold suppresses
  the click so links inside slides don't fire.

### Accessibility

- Root: `aria-roledescription="carousel"` + label; each slide
  `role="group"`, `aria-roledescription="slide"`, labelled "3 of 7" plus its
  name when it has one (see [Slide names](#slide-names)).
- **Off-screen slides are `inert`** (only those not in the current view when
  `perView > 1`), so focus can't land inside hidden content.
- Keyboard arrows navigate when the slider has focus.
- `prefers-reduced-motion`: autoplay off, transitions become instant.
- `aria-live="polite"` region announces manual changes; silent during autoplay.
- Autoplay requires a pause control (WCAG 2.2.2) — see Controls.

---

## Controls

### Blocks

| Block | Purpose |
|---|---|
| `supe/slides-overlay` | Area over the track: 3×3 grid (no layout support) |
| `supe/slides-bar` | Area below the slider: core flex layout (justification, gap, wrap) |
| `supe/slides-prev` / `supe/slides-next` | Buttons, `data-supe-slides-action="prev\|next"`; `arrows` set (shared by both) |
| `supe/slides-indicators` | Built at runtime from a `<template>`; block styles dots (default), bars, numbers (thumbnail indicators deferred) |
| `supe/slides-pause` | Pause/play toggle, `hidden` until the engine finds autoplay |

Two area blocks rather than one with a `placement` attribute (the plan's
first idea): the bar's flex layout controls would otherwise show, doing
nothing, on the overlay. Every control has `position` (overlay cell,
`is-position-{row}-{column}`; default prev center-left, next center-right,
indicators bottom-center, pause bottom-right) and core color, spacing,
border and font size supports. Shared PHP: `Blocks\Slides\Controls`
(cells, arrow sets, `icons.json` presets); JS mirror `shared/controls.js`.

- Any combination is allowed in either area — prev/next only, indicators
  only, both, or none (remove the area entirely).
- Controls are plain markup; `controls.js` finds them within the slider root.
  In the editor, clicking a control selects the block (no navigation).
- Each control gets core supports (color, spacing, border, typography where
  relevant) — padding/offset/positioning come for free.
- **Indicators are built at runtime** from a `<template>` holding the icon
  markup: the count depends on `perView`, `step`, and (for posts) how many
  posts the query returned.
- Areas are hidden until the engine runs and while there's nowhere to go
  (`[data-supe-slides]:not(.is-initialized.is-navigable)`).

### Placement

- The slider root is a one-column grid: the track and the overlay share the
  first cell (no absolute positioning, so the overlay is exactly the track's
  size), the bar sits in the second.
- **Overlay**: a **3×3 grid** of equal cells with `pointer-events: none`
  (clicks and drags pass through to slides). Each control re-enables
  `pointer-events` and picks a cell; margin acts as offset; controls in the
  same cell overlap.
- **Bar**: core flex layout (justification, gap, wrap).
- Arrow icons point "next"; prev is rotated 180°, and `--supe-slides-arrow`
  turns both for right / up / down sliders and right-to-left pages. Overlay
  indicators stack vertically on vertical sliders.

### Parent toggles and the pause rule

- The slider's **Controls** panel toggles **Arrows**, **Indicators**,
  **Pause button**: they're added to the overlay (created if needed) and
  removed from both areas; an emptied area is removed. Each control's own
  sidebar moves it between the areas ("Over the slides" / "Below") and picks
  its cell (`AlignmentMatrixControl`). New sliders start with arrows and
  indicators in the overlay.
- **The pause button is optional** (2026-11-26, user decision: sliders used
  as backgrounds, clients who don't need strict WCAG conformance). Nothing
  is inserted automatically and there's no warning; the toggle's help says
  it lets visitors stop autoplay. Built-in accessibility stays (inert,
  labels, live region, reduced motion, keyboard).
- A new area is created *around* its first controls: the editor won't insert
  or move blocks into an area it hasn't rendered yet (no block list
  settings), so moving a control to a missing area inserts a copy.

### Icons

- **Presets:** a few sets (chevron, arrow, caret, line) in
  `blocks/slides/icons.json` (name → SVG), read by both `render.php` and the
  editor so the preview matches the front end.
- **Uploads:** per control, choose a preset or upload an SVG.
  - Allowed for **anyone with `upload_files`** (filterable).
  - Sanitized **on upload** with `enshrined/svg-sanitize` (Composer) and
    **again on output** (defense in depth); sanitized markup cached.
  - Lives in `src/Editor/SvgUploads.php` (mime type + upload sanitizing)
    since it's site-wide, not slider-specific.
- Icons render **inline** so `currentColor` follows color controls.

---

## Lightbox

- One native `<dialog>` per slider, rendered only if at least one image slide
  has lightbox enabled.
- Opens on click of a lightbox-enabled image: full-size image (`srcset`),
  caption, prev/next across that slider's lightbox-enabled images, close
  button.
- `showModal()` provides focus containment and the backdrop; `Esc` closes;
  focus returns to the triggering image.
- Opening the lightbox pauses autoplay; closing syncs the slider to the last
  viewed image.

---

## Editor

- **No editing UI in the canvas** — it only ever shows the design. The
  canvas previews the real layout (per view, gap, height — the root carries
  the same variables as the front end, and the device preview's media
  queries pick the viewport) and shows **the view holding the selected
  slide**: that slide plus the next `perView − 1`, shifted back to stay full
  at the end (`perViewAt()` / `viewRange()` in `shared/layout.js`). Other
  slides are hidden by a `<style>` rule scoped to this track's direct
  children, so nested sliders keep their own state. Active slide = local
  state, never saved. No animation, no autoplay.
- **Sidebar, on the slider block** (2026-11-26, replacing the first
  in-canvas navigator bar):
  - **Slides** panel: type as a segmented [Images | Content] toggle.
  - **Images** / **Content** panel (`SlideList.js`): the slides in order,
    one row each (drag handle, number, thumbnail for images, name with the
    front end's fallbacks). **Drag a row** to reorder (pointer in a row's top
    or bottom half → drop line above/below; `moveBlockToPosition`, so undo
    works; custom drag type so editor drop zones ignore it). Each row has
    **move up/down buttons** (drag-only isn't accessible). **Clicking a row
    selects that slide block** (its settings open; the canvas shows it).
    "Add images" (gallery flow) or "Add slide", and a "Show all slides in
    the editor" toggle.
  - The rows' click target is a `div[role=button]`, not a `<button>`:
    browsers won't start a drag that begins on a button (why the first
    navigator's tabs couldn't be dragged).
  - **Layout** panel: one viewport switcher (synced with the device
    preview) for Columns (`RangeControl`), Gap (core spacing control, one
    side), "Height applies to" [Slider | Each slide], and Height
    (`HeightControl`: mode + px/vh/% number or ratio presets / custom).
  - Image defaults panel (images type).
- Selecting a block inside a slide (canvas or List View) shows that slide.
- Both slide types have a "Slide name" field (`metadata.name`).
- List View drag-and-drop and block movers also work for every slide type.
- Posts type shows Query Loop's normal preview.
- **Inspector panels (parent):** Type · Playback (autoplay, delay, loop,
  pause-on-hover) · Transition · Layout (per view, step, gap, height — all
  responsive via `ResponsiveControl`) · Controls (area + control toggles) ·
  Interaction (touch, mouse, keyboard) · Image defaults (images type only).
  As built: Slides · slide list · Layout · Playback · Transition ·
  Interaction · Controls · Image defaults.

---

## Files

```
blocks/
  slides/
    block.json, index.js, variations.js
    edit/
      Edit.js, TypePicker.js, TypePanel.js, SlideList.js, AddImages.js
      panels/ Playback.js, Transition.js, Layout.js, Controls.js, Interaction.js, ImageDefaults.js
    engine/          (see Front-End Engine)
    view.js          ← finds .wp-block-supe-slides, mounts Slider
    render.php, icons.json
    style.scss, editor.scss
  slides-track/      block.json, index.js, edit.js, render.php
  slides-controls/   block.json, index.js, edit.js, render.php, style.scss
  slides-prev/, slides-next/, slides-indicators/, slides-pause/
  slide/             block.json, index.js, edit.js, render.php, style.scss
  image-slide/       block.json, index.js, edit.js, render.php, style.scss
src/
  Blocks/Slides/     ← shared PHP if render.php files grow: Config (validation), Icons, PostItems
  Editor/SvgUploads.php
```

`BlockRegistrar` registers every block from the manifest — no PHP
registration changes. `--experimental-modules` is on the `build`/`start`
scripts for `viewScriptModule` (`webpack.config.js` extends the scripts half
of the `[ scripts, modules ]` config it then gets). Add `enshrined/svg-sanitize` to
`composer.json`.

---

## Phases

0. **Responsive foundation** — phase 1 of `responsive-supports.md`, including
   responsive variables.
1. **Structure** ✅ — `slides`, `slides-track`, `slide`, `image-slide`;
   images/content variations + Type panel (confirm before replacing slides);
   dynamic render; slide class and "N of M: name" labels
   (`Supe\Editor\Blocks\Slides\Markup`, top-level slides only via
   `WP_HTML_Processor` depth); scroll-snap fallback; editor stacks slides.
   Moved out: `slides-controls` → phase 5 (an area is useless without control
   blocks), the posts variation → phase 8 (needs the post-item slide class).
2. **Editing** ✅ — sidebar slide list (drag + keyboard reorder, click to
   select, show all; canvas follows selection), type toggle, multi-image add (gallery flow), image settings (size,
   fit, focal point, alt, caption + position, link), parent image defaults,
   slide name field. Lightbox toggle left for phase 7.
3. **Layout** ✅ — responsive per view, gap, height (all modes, both
   targets), Layout panel, canvas preview of the current view; responsive
   variables ported to the portable JS.
4. **Engine** ✅ — `Blocks\Slides\Config` (+ `shared/config.js`, fixture
   `slides-config.json`) validates `loop`, `step`, `keyboard`, `autoplay`,
   `transition` into `data-supe-slides`; direction → root classes
   `is-vertical` / `is-reversed`. `engine/`: `math.js` (start = first slide in
   view; each slide moved to a slot via `--supe-slide-offset`, so loop is slot
   arithmetic, no clones), `Slider.js` (per view from the resolved CSS
   variable, `ResizeObserver`, vertical rows measured from the tallest slide
   when the slider has no height, `inert` off-view slides, live region
   reading the slides' labels, `supe-slides:change` / `:layout` events),
   `transitions/` registry (`slide`, `fade` — page-only), `autoplay.js`
   (pauses on hover, focus, hidden tab, off screen, reduced motion; returns
   `pause()`/`resume()` for phase 5), `keyboard.js`. Editor: Playback and
   Transition panels (effects/directions from the registry), "Rows" for
   vertical, canvas previews direction. **Until phase 5 adds the pause
   control, autoplay has no visible pause button (WCAG 2.2.2).**
5. **Controls** ✅ — overlay + bar areas, prev/next/indicators/pause blocks,
   preset arrow sets (`shared/icons.json`), Controls panel, per-control area
   and position, `engine/controls.js` (actions, disabled ends, indicators
   from `indicatorStarts()`, pause/play label). Pause optional (see above).
6. **Drag** ✅ — `drag: { touch, mouse }` (default touch on, mouse off) in
   `Config` + fixture; `engine/drag.js` (Pointer Events; a gesture becomes
   a drag after 6px along the axis, one going across first is left to page
   scrolling — `touch-action: pan-y` / `pan-x`; pointer capture; grab
   cursor; native image/link drags prevented; the click ending a drag is
   swallowed). Slides follow the pointer (`Slider.drag()`, slots from
   `dragSlots()` so looping back lines the previous slides up before the
   view), held back past the ends without loop (`resist()`). Release
   (`releaseSteps()`): moves when past 20% of a slide or flicked
   (> 0.3px/ms; a flick back cancels), by the nearest whole number of
   slides in whole steps; animates on from where the slides were, for the
   remaining part of the duration (`Slider.move()`, shared with `goTo()`).
   Autoplay holds during a drag (`autoplay.hold()`). Editor: Interaction
   panel (arrow keys, swipe on touch screens, drag with a mouse; disabled
   for transitions without `supportsDrag`).
7. **Lightbox.**
8. **Posts** — posts variation, locked Query Loop, slide class at render,
   "Selected posts" (after the editor-preview spike).
9. **SVG uploads** — `SvgUploads` service, upload + output sanitizing,
   custom icons in controls.

### Testing (each phase)

- **PHP Unit:** config validation, responsive variable output, post-item
  class injection, icon rendering, SVG sanitizing.
- **Jest** (`wp-scripts test-unit-js`): loop/index/step math, page counts per
  `perView`, transition registry, drag thresholds.
- **Feature:** render output for each type; controls areas; lightbox dialog
  present only when needed.

---

## Deferred

- **Thumbnail indicators** (image slides / post featured images).
- **"Labels" indicator style** built from slide names.
- **Per-slide transition/delay overrides** — all timing stays on the parent
  for now.
