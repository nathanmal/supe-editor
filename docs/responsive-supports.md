# Responsive Supports — Plan

**Status:** Phase 1 done (2026-11-04) — PHP framework, spacing support
(declarative, not yet opted into any block), responsive variables, and the
JS `ResponsiveControl` (not yet in any build). Phases 2+ not started. Design
decisions made on 2026-10-25; update this doc as phases land (and log them
in `PROGRESS.md`).

Custom block supports (starting with padding/margin) that work on both
`supe/*` blocks and core blocks, with per-viewport values: **desktop is the
default**, tablet and mobile can override it. Built so later supports (gap,
visibility, font size, …) reuse the same machinery.

The same foundation also provides **responsive variables** — per-viewport
values for a block's *own* settings (see [Responsive Variables](#responsive-variables)).
Phase 1 is a prerequisite for the [Slides block](slides.md).

---

## Decisions

| Topic | Decision |
|---|---|
| Delivery | A custom **block support**, opted into per block — not per-block controls |
| Scope | Applies to `supe/*` blocks **and** core blocks |
| Markup | Added at **render time** in PHP (`render_block`), never in `save()` |
| CSS | Inline CSS custom properties per block + one generated stylesheet of media queries |
| Cascade | Desktop-first (`max-width` queries); mobile → tablet → desktop fallback |
| Values | Theme spacing **presets by default**, with optional custom `px` / `rem` / `%` |
| Breakpoints | Site-wide setting with defaults (`tablet: 1024`, `mobile: 600`) |
| Core spacing | Eventually replaced by this support via a bridge (hide core controls, migrate values) |
| Code layout | One self-contained folder per support under `supports/`; shared framework in `src/Supports/` + `supports/_framework/`; controls reusable outside supports in `components/` |
| PHP loading | Support files **return** an anonymous-class instance, loaded by a registry — no autoloading for `supports/` |

---

## Data Shape

Every support stores its value under one namespaced attribute, `supe`, keyed
by support name. Responsive properties hold sparse per-viewport values —
desktop is the base, tablet/mobile store only what they override:

```json
"supe": {
  "spacing": {
    "padding": {
      "desktop": { "top": "var:preset|spacing|40", "right": "2rem", "bottom": "var:preset|spacing|40", "left": "2rem" },
      "tablet":  { "top": "var:preset|spacing|30" },
      "mobile":  { "top": "1rem", "bottom": "1rem" }
    },
    "margin": { "desktop": { "bottom": "3rem" } }
  }
}
```

Blocks opt in from `block.json`:

```json
"supports": { "supe": { "spacing": true } }
```

Core blocks are opted in server-side (see [Core Blocks](#core-blocks)).

---

## How It Renders

### Per block: CSS custom properties

`Renderer` (one `render_block` pass for all supports) uses
`WP_HTML_Tag_Processor` to add, for each value that is *set*, a class and a
variable for that side and viewport (appended to any existing `style`):

```html
<div class="wp-block-group has-supe-pt has-supe-pt-t has-supe-pt-m has-supe-pb"
     style="--supe-pt:var(--wp--preset--spacing--40);--supe-pt-t:var(--wp--preset--spacing--30);--supe-pt-m:1rem;--supe-pb:…">
```

Naming: `supe-{var}{side}` for desktop, `-t` / `-m` suffixes for tablet /
mobile. `{var}` comes from `support.json` (`p`, `m`, …), `{side}` is
`t`/`r`/`b`/`l`.

### Site-wide: one generated stylesheet

```css
.has-supe-pt { padding-top: var(--supe-pt); }
@media (max-width: 1024px) { .has-supe-pt-t { padding-top: var(--supe-pt-t); } }
@media (max-width: 600px)  { .has-supe-pt-m { padding-top: var(--supe-pt-m); } }
```

- **One class per side *and viewport*, added only when that value is set.**
  A rule referencing an unset variable would resolve to the property's
  initial value (`0`) and wipe out theme/core spacing — so a tablet-only
  value must not touch desktop.
- No `var()` fallback chains are needed: desktop-first `max-width` queries
  cascade by themselves. At mobile widths the tablet query also matches, so
  an unset mobile value inherits tablet's, then desktop's.
- Rules are single-class selectors; a theme rule with higher specificity
  (e.g. `.entry-content p { margin: … }`) can still win. Revisit if that
  shows up in practice.
- Breakpoints are user-configurable and media queries can't read CSS
  variables, so this CSS is **generated in PHP** (`StyleGenerator`) from every
  registered support's `rules()`. It's a few dozen short rules (~1 KB for
  spacing), so it's built once per request in memory rather than cached in
  the database (a transient read would cost more than building it).
- Enqueued inline (`wp_add_inline_style`) on `enqueue_block_assets`, so it also
  loads inside the editor iframe. On the front end, enqueue only once the
  `Renderer` sees a block using a responsive support.

### Responsive Variables

Supports apply to CSS properties on any block. Blocks also need responsive
values for their *own* settings (e.g. `supe/slides` slides per view, gap,
height). Those use the same value shape, `ResponsiveControl`, breakpoints, and
sanitizer, but resolve into a single custom property the block's CSS consumes:

```css
.wp-block-supe-slides { --supe-slides-per-view: var(--supe-slides-per-view-d); }
@media (max-width: 1024px) {
  .wp-block-supe-slides { --supe-slides-per-view: var(--supe-slides-per-view-t, var(--supe-slides-per-view-d)); }
}
@media (max-width: 600px) {
  .wp-block-supe-slides { --supe-slides-per-view: var(--supe-slides-per-view-m, var(--supe-slides-per-view-t, var(--supe-slides-per-view-d))); }
}
```

- Blocks register their variables with `StyleGenerator` (selector, full
  variable names without `--`, and a `ValueSanitizer` type), e.g.

  ```php
  supe( 'supe.editor.styles' )->registerVariables( '.wp-block-supe-slides', [
      'supe-slides-per-view' => [ 'type' => 'int', 'min' => 1, 'max' => 12 ],
      'supe-slides-gap'      => 'spacing',
  ] );
  ```

  The rules join the same generated stylesheet.
- Block render code gets the inline declarations from
  `variableStyles( 'supe-slides-per-view', $values )` (and
  `StyleGenerator::inline()` to build the `style` string). It sanitizes each
  viewport value and enqueues the stylesheet.
- **Unset viewports are written as `initial`** (`--supe-slides-per-view-t:initial`).
  Custom properties inherit, so without this a slider nested in another
  slider would pick up the outer one's tablet value; `initial` makes the
  `var()` fall back instead.
- If no viewport is set, the resolved variable is invalid and the block's CSS
  supplies the default (`var(--supe-slides-per-view, 1)`).
- Front-end JS reads the resolved variable with `getComputedStyle()` and
  never needs the breakpoint values.
- `ValueSanitizer` types: `spacing`, `margin` (spacing + negatives + `auto`),
  `length` (`px` / `%` / `vh` / `0` / `auto`), `ratio` (`w/h` or a single
  number, all positive, or `auto`), `int` (bounded).

### Why render-time instead of `save()`

| | `save()` / `getSaveContent.extraProps` | `render_block` (chosen) |
|---|---|---|
| Static blocks | ✅ | ✅ |
| Dynamic (`render.php`) blocks | ❌ | ✅ |
| Core blocks | ❌ validation errors on existing content | ✅ |
| Changing output later | needs deprecations | free |
| Conditional CSS loading | ❌ | ✅ |

---

## Editor

### Filters (registered once by the framework, for every support)

- `blocks.registerBlockType` — adds the `supe` attribute to blocks that opt in.
- `editor.BlockEdit` — injects each support's panel into `InspectorControls`
  (`group="styles"`).
- `editor.BlockListBlock` — adds the same classes/variables to `wrapperProps`
  so the canvas matches the front end. The editor's Tablet/Mobile preview is a
  resized iframe, so the generated media queries apply there too.

### `ResponsiveControl`

Wraps any control with:

- A **viewport switcher** (desktop / tablet / mobile), synced both ways with
  the editor device preview via `select( 'core/editor' ).getDeviceType()` /
  `dispatch( 'core/editor' ).setDeviceType()`.
- **Inherited values as placeholders** on tablet/mobile, an indicator on
  viewports that have overrides, and a per-viewport "reset to inherited".
- Labels showing the configured breakpoints, e.g. "Tablet (≤1024px)" (passed to
  the editor script from PHP).

### `SpacingSizeControl` — presets first, custom optional

- **Presets** are the theme's spacing scale (`theme.json`
  `settings.spacing.spacingSizes`, or WordPress's generated default scale).
  Stored as references (`var:preset|spacing|40`) so changing the theme scale
  updates every block.
- Default UI is a slider over preset steps, with a **"Set custom size"**
  toggle to a number + unit input limited to `px`, `rem`, `%` — the same
  pattern as core's spacing control.
- Optionally a site setting can disable custom values entirely.
- Note: `%` padding/margin resolves against the container's **width**, even
  for top/bottom.

---

## Breakpoints

- Option `supe_editor_breakpoints`, registered with `register_setting()`
  (`show_in_rest: true`), default `{ "tablet": 1024, "mobile": 600 }`.
- Validation: positive integers, `mobile < tablet`.
- Edited on a **Responsive** settings page under the shared Supe menu
  (`Admin\ResponsivePage`, added via `addAdminPage()` like `BlocksPage`).
  `supe-core` has no settings abstraction yet — if more settings pages are
  coming, extract a small base class into `supe-core`.
- **Editor preview caveat:** WordPress's device previews are fixed at roughly
  780px (Tablet) and 360px (Mobile), with no supported way to change them. If
  the tablet breakpoint is set below ~780, the Tablet preview shows desktop
  styles — the settings page should warn about values outside the preview
  widths.
- All responsive supports share these breakpoints.

---

## Core Blocks

`SupportRegistry` uses `register_block_type_args` to add
`supports.supe.{name}` (and the `supe` attribute schema — needed for dynamic
blocks and REST validation, or WordPress strips the attribute) to the core
blocks listed in each support's `support.json` `coreBlocks`.

### Replacing core `supports.spacing` (the bridge)

Static core blocks (Group, Columns, Cover, …) serialize core spacing as
`style="padding:…"` into saved markup. Setting `supports.spacing = false`
would make every existing block with padding fail validation ("unexpected or
invalid content"). So the bridge:

1. **Keeps core's support enabled but hides its controls** — disables
   `spacing.padding` / `spacing.margin` per block via the
   `wp_theme_json_data_default` filter. Existing markup stays valid.
2. **Migrates on edit** — when a block with `style.spacing.padding|margin`
   loads in the editor, move the value into `supe.spacing.*.desktop` and clear
   the core value. The block re-saves without core's inline style.
3. **Leaves `blockGap` alone** — it lives under `spacing` but belongs to layout.

A bulk WP-CLI migration is possible later; migrate-on-edit avoids touching
content in bulk. The bridge is a separate, optional file so it can be enabled
only once the support is stable.

---

## Directory Layout

```
components/                      ← shared editor components (@supe-editor/components)
  responsive/
    index.js                     ← exports the pieces below
    ResponsiveControl.js         ← render-prop wrapper: viewport tabs, inherited value, reset
    ViewportSwitcher.js
    use-viewport.js              ← device-preview sync (`core/editor` by name, local state fallback)
    utils.js                     ← inheritedValue / setViewportValue / hasOwnValue
    test/utils.test.js           ← Jest (`npm run test:js`)
  controls/
    SpacingSizeControl.js        ← phase 2
blocks/                          ← unchanged
supports/
  index.js                       ← webpack entry: imports each support's index.js (explicit list)
  _framework/                    ← supports-only JS (phase 2)
    register-support.js          ← attribute / inspector / preview filters for any support
    to-css-vars.js               ← mirrors the PHP Renderer's variable output
  spacing/
    support.json                 ← name, properties, var prefixes, coreBlocks
    support.php                  ← returns the support object
    bridge.php                   ← optional: core spacing bridge
    index.js                     ← registerSupport( metadata, { Control, migrate } )
    Control.js
    migrate-core.js
  visibility/                    ← future support, same shape
src/
  Supports/
    SupportRegistry.php          ← loads supports, adds them to block types
    AbstractSupport.php
    AbstractResponsiveSupport.php
    Renderer.php                 ← single render_block pass
    Responsive/
      Breakpoints.php            ← option, defaults, validation
      StyleGenerator.php         ← media-query CSS from all supports + responsive variables
      Viewport.php               ← enum: desktop / tablet / mobile
      ValueSanitizer.php         ← preset refs, px/rem/%, shared
  Editor/
    EditorAssets.php             ← (or a sibling) enqueues build/supports/index.js
  Admin/
    BlocksPage.php
    ResponsivePage.php
tests/Unit/Supports/…, tests/Unit/Supports/Responsive/…
```

### `support.json` — shared by JS and PHP

The single source of truth for a support, like `block.json` for blocks. JS
imports it; PHP reads it with `wp_json_file_decode()`.

```json
{
  "name": "spacing",
  "responsive": true,
  "properties": {
    "padding": { "css": "padding", "sides": true, "var": "p" },
    "margin":  { "css": "margin",  "sides": true, "var": "m" }
  },
  "coreBlocks": [ "core/group", "core/columns", "core/column", "core/cover" ]
}
```

### `support.php` — returns the support, no autoloading

`supports/` folders stay lowercase (matching `blocks/`), which PSR-4 can't
map reliably on case-sensitive filesystems. Instead each `support.php`
returns an anonymous-class instance, the same convention as
`blocks-manifest.php` and `render.php`:

```php
<?php

declare(strict_types=1);

use Supe\Editor\Supports\AbstractResponsiveSupport;

return new class extends AbstractResponsiveSupport {
    public function sanitize( array $value ): array {
        // …
    }
};
```

```php
// SupportRegistry
foreach ( $this->names as $name ) {   // explicit list, e.g. [ 'spacing' ]
    $dir      = $this->supportsDir . $name . '/';
    $metadata = wp_json_file_decode( $dir . 'support.json', [ 'associative' => true ] );
    $support  = require $dir . 'support.php';

    $support->boot( $metadata, $this->sanitizer, $this->styles );
    $this->supports[ $name ] = $support;
}
```

- No class names, namespaces, or `composer dump-autoload` for supports;
  nothing outside a support can reference it except through the registry.
- Shared services are handed over in `boot()` (anonymous classes can't easily
  take constructor args from the container).
- Use `require`, not `require_once` — `require_once` returns `true` on a
  repeat load instead of the object.
- `bridge.php` follows the same pattern and is loaded only if present.
- Tests load a support directly: `$support = require 'supports/spacing/support.php';`.
- PHPStan, if added, needs `scanDirectories: [ supports ]`.

Discovery is an explicit list (in `SupportRegistry` and `supports/index.js`)
for now; switch to globbing `supports/*/support.json` if the count grows.

---

## Build

- Add a `webpack.config.js` extending the `@wordpress/scripts` default config:
  blocks keep their existing pipeline (`--webpack-src-dir=blocks
  --blocks-manifest`), plus one extra entry `supports/index.js` →
  `build/supports/index.js` + `index.asset.php`. (`--webpack-src-dir=blocks`
  only discovers directories containing a `block.json`.)
- `blocks-manifest.php` is generated only from `blocks/`, so the extra entry
  doesn't affect `BlockRegistrar`.
- Update `lint:js` / `lint:css` scripts to include `supports/`.

---

## Security

Every value is written into a `style` attribute, so **PHP sanitizes
everything** before output (`ValueSanitizer`), regardless of what the editor
allowed:

- Preset references: `var:preset|spacing|{slug}` with a slug matching
  `[a-z0-9-]+` → `var(--wp--preset--spacing--{slug})`.
- Custom values: number + `px` | `rem` | `%`, or `0`. Margin additionally
  allows negative numbers and `auto`.
- Anything else is dropped silently.

---

## Testing

- **Unit** (Brain Monkey): `ValueSanitizer`, `Breakpoints` validation,
  `StyleGenerator` output, `Renderer` class/variable output, each support's
  `sanitize()`.
- **Feature**: `render_block` output for a `supe/*` block and a core block;
  support/attribute registration on core block types; stylesheet enqueued only
  when used.

---

## Phases

1. ✅ **Framework, PHP side** — `Breakpoints` (option + defaults), `ValueSanitizer`,
   `StyleGenerator` (supports **and** responsive variables), `SupportRegistry`,
   `Renderer`, `spacing/support.json` + `support.php`, plus a JS-side
   `ResponsiveControl` usable outside supports. Tests. **Blocks the Slides
   block** (`slides.md`).
2. **Build + editor wiring** — `webpack.config.js`, `EditorAssets`,
   `register-support.js` (attribute / panel / preview filters).
3. **Controls** — `ResponsiveControl` with device-preview sync and inherited
   placeholders; `SpacingSizeControl` with presets + custom values.
4. **Supe blocks opt in** — `supe/callout`, container.
5. **Core blocks opt in** — via `coreBlocks`, with core's own controls still
   visible.
6. **Settings page** — `ResponsivePage` for breakpoints, with the preview-width
   warning.
7. **Core spacing bridge** — `bridge.php` + `migrate-core.js`.
8. **More supports** — gap, visibility, … using the same framework.

---

## Open Questions

- Which core blocks go in `spacing`'s `coreBlocks` initially?
- Site setting to disallow custom values (presets only) — needed now or later?
- Should `supe/*` blocks that opt in also set `supports.spacing: false` from
  the start (they have no legacy content to protect)?
