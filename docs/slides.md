# Slides Block — Plan

**Status:** Planned, not started. Captures the design decisions made on
2026-11-04; update this doc as phases land (and log them in `PROGRESS.md`).

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
| Controls | Blocks, in an **overlay** layer (3×3 grid, z-index above the track) and/or an area **below** the slider — each optional |
| Icons | Preset sets + SVG uploads (anyone with `upload_files`), sanitized on upload and on output, rendered inline |
| Image slides | Per-image fit, size, focal point, alt, caption, lightbox; parent-level defaults |
| Lightbox | Custom: one native `<dialog>` per slider, prev/next across its images |
| Ordering | Block-based (List View, movers) + drag-to-reorder in the editor's slide navigator; posts via query order or "Selected posts" |
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
 ├─ supe/slides-controls          ← optional, placement: "overlay"
 │    └─ any of: prev, next, indicators, pause
 └─ supe/slides-controls          ← optional, placement: "below"
      └─ any of: prev, next, indicators, pause
```

- **Track vs. controls containers** keep slides and controls from mixing in
  one inner-block list — `allowedBlocks`, indicator counts, and List View all
  stay simple.
- The track's `allowedBlocks` depends on the parent's `type`:
  images → `supe/image-slide`; content → `supe/slide`; posts → one `core/query`.
- Each child block sets `"parent"` / `"ancestor"` so it can only be inserted in
  the right container.
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
- Changing type later replaces the track's contents — the editor asks for
  confirmation first.

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
  - editor slide navigator tabs and List View;
  - the slide's accessible label ("Slide 3 of 7: Summer collection");
  - indicator buttons' `aria-label` and `title` ("Go to slide: Summer collection").
- Names are never shown visually on the front end in v1. A "labels"
  indicator style (text tabs from slide names) would be a natural later
  addition.

---

## Slide Types

### Content slides (`supe/slide`)

- InnerBlocks, behaves like a Group: background color/image, padding, vertical
  content alignment (core supports for now; the custom spacing support once it
  exists).

### Image slides (`supe/image-slide`)

- **Adding:** an "Add images" button on the parent opens the media library
  with multiple selection (its gallery view also allows ordering before
  insert); one `supe/image-slide` is created per image. Adding again appends.
- **Per-image settings** (each falls back to a parent default when unset):
  - image size (thumbnail, large, full, …)
  - fit: `cover` / `contain` / `fill` / `none` → `object-fit`
  - focal point (`FocalPointPicker`) → `object-position`
  - lightbox on/off
- **Alt text:** empty = use the media library's alt, resolved at render time
  (so library edits flow through); a per-slide value overrides it.
- **Caption:** RichText, optionally pre-filled from the library caption.
  Position: below, overlaid at the bottom, or hidden.
- **Link:** optional; mutually exclusive with lightbox on the same image.
- **Output:** `wp_get_attachment_image()` for `srcset`/`sizes`. First slide
  `loading="eager"` + `fetchpriority="high"`; the rest lazy.

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
    "target": "slider | slide",
    "desktop": { "mode": "ratio", "value": "16/9" },
    "tablet":  { "mode": "vh",    "value": 60 },
    "mobile":  { "mode": "auto" }
  },
  "drag": { "touch": true, "mouse": false },
  "keyboard": true,
  "imageDefaults": { "size": "large", "fit": "cover", "lightbox": false }
}
```

Validated in PHP before being written to the wrapper as
`data-supe-slides='{…}'` (non-responsive values) and as responsive CSS
variables (`perView`, `gap`, `height`).

### Slides per view

- One setting, labelled **Columns** for left/right transitions and **Rows**
  for up/down.
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
- **Target:**
  - `slider` (default): applies to the viewport; slides fill it
    (divided by rows for vertical).
  - `slide`: applies to each slide; the viewport's height derives from it.
    For horizontal this is plain CSS. For vertical, viewport height =
    `perView × slide height + gaps`: CSS `calc()` covers `px`/`vh`; for
    `ratio`, either container query units (`container-type: inline-size` on
    the root, slide height `calc(100cqw / ratio)`) or the engine measures the
    first slide. `auto` isn't offered for `slide` target.

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
| `supe/slides-controls` | Container; `placement: "overlay" \| "below"` (two variations) |
| `supe/slides-prev` / `supe/slides-next` | Buttons, `data-supe-slides-action="prev\|next"` |
| `supe/slides-indicators` | Indicator list; style: dots, bars, numbers (thumbnail indicators deferred) |
| `supe/slides-pause` | Pause/play toggle |

- Any combination is allowed in either area — prev/next only, indicators
  only, both, or none (remove the area entirely).
- Controls are plain markup; `controls.js` finds them within the slider root.
  In the editor, clicking a control selects the block (no navigation).
- Each control gets core supports (color, spacing, border, typography where
  relevant) — padding/offset/positioning come for free.
- **Indicators are built at runtime** from a `<template>` holding the icon
  markup: the count depends on `perView`, `step`, and (for posts) how many
  posts the query returned.
- Controls read the `navigable` context and hide when navigation is disabled.

### Placement

- **Overlay** area: absolutely positioned over the track, `z-index` above it,
  laid out as a **3×3 grid** with `pointer-events: none` (clicks and drags
  pass through to slides). Each control re-enables `pointer-events` and picks
  a cell (top-left … center-right … bottom-center); spacing supports act as
  offset.
- **Below** area: normal flow after the track, core flex layout
  (justification, gap, wrap).

### Parent toggles and the pause rule

- Inspector toggles **Arrows**, **Indicators**, **Pause** insert/remove the
  matching blocks (into the overlay area by default, creating it if needed).
- **Enabling autoplay auto-inserts a pause block**; the editor shows a
  warning if it's removed while autoplay is on.

### Icons

- **Presets:** a few sets (chevron, arrow, caret, line) in
  `blocks/slides/icons.json` (name → SVG), read by both `render.php` and the
  editor so the preview matches the front end.
- **Uploads:** per control, choose a preset or upload an SVG.
  - Allowed for **anyone with `upload_files`** (filterable).
  - Sanitized **on upload** with `enshrined/svg-sanitize` (Composer) and
    **again on output** (defense in depth); sanitized markup cached.
  - Lives in `src/Services/SvgUploads.php` (mime type + upload sanitizing)
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

- **One slide at a time** in the canvas (others hidden via an editor-only
  class keyed to local state — never saved), no animation, no autoplay.
- **Slide navigator** bar under the slider: tabs showing each slide's number
  and name (plus a small thumbnail for image slides), "+ Add slide" /
  "Add images", "Show all" toggle.
  - Selecting a slide in List View jumps the navigator to it.
  - **Drag tabs to reorder** — via `moveBlockToPosition` on the
    `core/block-editor` store (same operation as List View; undo works).
    Native HTML drag events first; `dnd-kit` if that proves clunky.
  - **Keyboard move buttons** on each tab (drag-only isn't accessible).
- List View drag-and-drop and block movers also work for every slide type.
- Posts type shows Query Loop's normal preview.
- **Inspector panels (parent):** Type · Playback (autoplay, delay, loop,
  pause-on-hover) · Transition · Layout (per view, step, gap, height — all
  responsive via `ResponsiveControl`) · Controls (area + control toggles) ·
  Interaction (touch, mouse, keyboard) · Image defaults (images type only).

---

## Files

```
blocks/
  slides/
    block.json, index.js, variations.js
    edit/
      Edit.js, TypePicker.js, SlideNavigator.js
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
  Services/SvgUploads.php
```

`BlockRegistrar` registers every block from the manifest — no PHP
registration changes. Add `--experimental-modules` to the `build`/`start`
scripts for `viewScriptModule`. Add `enshrined/svg-sanitize` to
`composer.json`.

---

## Phases

0. **Responsive foundation** — phase 1 of `responsive-supports.md`, including
   responsive variables.
1. **Structure** — `slides`, `slides-track`, `slides-controls`, `slide`,
   `image-slide`; type variations; dynamic render; slide class; scroll-snap
   fallback.
2. **Editing** — slide navigator (drag + keyboard reorder), multi-image
   select, image settings (fit, size, focal point, alt, caption), parent
   defaults.
3. **Layout** — responsive per view, gap, height (all modes, both targets).
4. **Engine** — index/loop math, step, `slide` + `fade`, autoplay, keyboard,
   accessibility, reduced motion.
5. **Controls** — prev/next/indicators/pause blocks, overlay grid + below
   area, preset icons, parent toggles, pause rule.
6. **Drag** — pointer handling, axis, thresholds, click suppression.
7. **Lightbox.**
8. **Posts** — locked Query Loop, slide class at render, "Selected posts"
   (after the editor-preview spike).
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
