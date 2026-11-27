# Responsive Supports — Plan

**Status:** Phases 1–4 done (2026-11-15) — PHP framework, responsive
variables, editor wiring, the spacing panel, a portable JS renderer kept
identical to the PHP by shared fixtures, stored-value versioning, and
`supe/callout` + container opted in. Next: phase 5 (core blocks). Design
decisions made on 2026-10-25 and 2026-11-14; update this doc as phases land
(and log them in `PROGRESS.md`).

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
| Values | Theme spacing **presets by default**, with optional custom values in the units core's control offers (`px`, `em`, `rem`, `%`, `vh`, `vw`) |
| Breakpoints | Site-wide setting with defaults (`tablet: 1024`, `mobile: 600`) |
| Core spacing | **Never both on one block**: wherever responsive spacing is enabled, core padding/margin is off, so the two never collide and no CSS overrides are needed (2026-11-15) |
| Code layout | One self-contained folder per support under `supports/`; shared framework in `src/Supports/` + `supports/_framework/`; controls reusable outside supports in `components/` |
| PHP loading | Support files **return** an anonymous-class instance, loaded by a registry — no autoloading for `supports/` |
| Rule priority | Generated rules are `!important`, so a block's own value wins like core's inline styles do |
| Versioning | Each support versions its **stored value shape** (`support.json` `version`, stored as `v`); readers upgrade older values |
| JS/PHP parity | `support.json` is rendered by PHP **and** a portable JS module (editor preview, headless front ends); shared fixtures keep them identical |
| Own blocks | Opting in turns core padding/margin off automatically (support.json `replaces`, enforced in PHP and JS) — block.json doesn't need to remember |
| Core blocks | Opt in **together with** the bridge — core's padding/margin controls hidden and existing values migrated — never alongside core's controls |

---

## Data Shape

Every support stores its value under one namespaced attribute, `supe`, keyed
by support name. Responsive properties hold sparse per-viewport values —
desktop is the base, tablet/mobile store only what they override:

```json
"supe": {
  "spacing": {
    "v": 1,
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
- Rules are `!important` (e.g. `.has-supe-mb-t{margin-bottom:var(--supe-mb-t)!important}`).
  As plain single-class rules they lost to core's layout rules — e.g.
  `:root :where(.is-layout-flow) > :last-child { margin-block-end: 0 }` —
  while core's own spacing wins with inline styles. A value set on one block
  should behave the same. The rules are equally important among themselves,
  so the later media queries still override desktop; a theme can only
  override them with `!important` of its own.
- Breakpoints are user-configurable and media queries can't read CSS
  variables, so this CSS is **generated in PHP** (`StyleGenerator`) from every
  registered support's `rules()`. It's a few dozen short rules (~1 KB for
  spacing), so it's built once per request in memory rather than cached in
  the database (a transient read would cost more than building it).
- Enqueued inline (`wp_add_inline_style`) on `enqueue_block_assets`, so it also
  loads inside the editor iframe. On the front end, enqueue only once the
  `Renderer` sees a block using a responsive support.
- The editor collects the iframe's styles in **temporary `WP_Styles`
  instances** (`_wp_get_iframed_editor_assets()`), each starting from the
  main instance's registrations and running `enqueue_block_assets` again. So
  `StyleGenerator::enqueue()` asks `wp_style_is( …, 'registered' )` of the
  current instance and enqueues on every call — remembering "already done"
  in a flag kept the stylesheet out of the canvas (covered by a Feature test).

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

### Versioning stored values

Saved content outlives code, so each support versions the **shape of its
stored value** — not the package (whose version changes with any code
change) and not the support's code.

- `support.json` declares `"version": 1`; every stored value carries it as
  `v` (written always, even for 1, so headless readers never guess). A value
  without `v` reads as version 1.
- Bump the version only when old values would be misread under a new shape
  (renaming `padding`, reorganizing viewports). Adding an optional key needs
  no bump.
- Readers (PHP `Renderer`, the editor, headless front ends) **upgrade on
  read**: `AbstractSupport::upgrade()` / `upgrade.js` run the support's
  migrations — `[ 1 => fn( $value ) => …v2 shape… ]` in PHP, `{ 1: ( value )
  => … }` in JS, identical — from the stored version to the current one. The
  editor writes the current shape the next time the block's value is edited;
  nothing is rewritten in bulk.
- Values that can't be read (invalid `v`, a version newer than the code, a
  missing migration) render nothing, and the editor hides the panel rather
  than overwrite them.

### Portable JS and shared fixtures

The same `support.json` is rendered by PHP and by `supports/_framework/`'s
portable modules — `sanitize.js` (ValueSanitizer), `upgrade.js`, and
`render.js` (`supportOutput()`, `supportRules()`, `stylesheet()`). They
import nothing from WordPress (a Jest test enforces it), so a headless
front end can render blocks exactly as WordPress does: classes + inline
variables per block, plus the stylesheet for the site's breakpoints.

`tests/fixtures/` holds the cases both sides must agree on —
`value-sanitizer.json` and `supports/{name}.json` (stored values with their
expected classes/styles, including version edge cases, and the expected
stylesheet for given breakpoints). PHPUnit and Jest both run every case, so
the two implementations can't drift apart unnoticed. Responsive variables
(`registerVariables()` / `variableStyles()`) are ported in
`supports/_framework/variables.js` (`stylesheet()` takes them as a third
argument), tested against `tests/fixtures/responsive-variables.json`.

---

## Editor

### Filters (registered once by the framework, for every support)

In `supports/_framework/register-support.js`; each support calls
`registerSupport( metadata, { Panel, migrations } )` from its `index.js`.

- `blocks.registerBlockType` — opts in the `coreBlocks` from support.json,
  turns off the core features listed in `replaces` on blocks that opt in
  themselves (`core-supports.js`, twin of
  `SupportRegistry::withoutReplacedCoreSupports()`), and adds the `supe`
  attribute to blocks that opt in.
- `editor.BlockEdit` — injects each support's panel into `InspectorControls`
  (`group="styles"`), handing it the value upgraded to the current shape;
  changes are stored with the current `v`, and an empty value drops its key.
- `editor.BlockListBlock` — adds the classes/variables from `render.js`, so
  the canvas matches the front end. The editor's Tablet/Mobile preview is a
  resized iframe, so the generated media queries apply there too.
- The script (`build/supports/index.js`, handle `supe-editor-supports`) is
  enqueued by `Supports\SupportAssets`, which passes the breakpoints as
  `window.supeEditor.settings`.

### `ResponsiveControl`

Wraps any control with:

- A **viewport switcher** (desktop / tablet / mobile), synced both ways with
  the editor device preview via `select( 'core/editor' ).getDeviceType()` /
  `dispatch( 'core/editor' ).setDeviceType()`.
- **Inherited values as placeholders** on tablet/mobile, an indicator on
  viewports that have overrides, and a per-viewport "reset to inherited".
- Labels showing the configured breakpoints, e.g. "Tablet (≤1024px)" (passed to
  the editor script from PHP).
- Several controls can share one switcher (`showSwitcher={ false }`,
  `hideLabelFromVision`); the spacing panel shows one for padding and margin.
  Controls that can't show inherited placeholders get a "Using the Desktop
  value." note instead.

### `SpacingSizeControl` — presets first, custom optional

- A thin wrapper (`components/controls/`) around core's
  `__experimentalSpacingSizesControl`, so the UI matches core's dimensions
  panel (preset slider, custom value toggle, linked/axial/per-side views) and
  an API change only needs fixing in one file.
- **Presets** are the theme's spacing scale (`theme.json`
  `settings.spacing.spacingSizes`, or WordPress's generated default scale).
  Stored as references (`var:preset|spacing|40`) so changing the theme scale
  updates every block.
- Custom values use the theme's `spacing.units` (supe-theme: `px`, `em`,
  `rem`, `%`, `vh`, `vw`), so `ValueSanitizer` accepts exactly those.
- Core's control chooses its view from the values it mounts with, so the
  panel remounts it per viewport (`key={ viewport }`).
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
  responsive/                    ← ResponsiveControl, ViewportSwitcher, useViewport, utils (+ Jest)
  controls/SpacingSizeControl.js ← wraps core's spacing control
blocks/                          ← supe/callout and container opt in via block.json
supports/
  index.js                       ← webpack entry: imports each support's index.js (explicit list)
  _framework/
    register-support.js          ← attribute / inspector / preview filters for any support
    settings.js                  ← window.supeEditor.settings (breakpoints)
    sanitize.js, upgrade.js,     ← portable: no WordPress imports (headless)
    render.js
    test/                        ← Jest, driven by tests/fixtures/
  spacing/
    support.json                 ← name, version, properties, var prefixes, coreBlocks
    support.php                  ← returns the support object
    index.js                     ← registerSupport( metadata, { Panel } )
    Panel.js
    bridge.php, migrate-core.js  ← phase 7: core spacing bridge
  visibility/                    ← future support, same shape
src/
  Supports/
    SupportRegistry.php          ← loads supports, adds them to block types
    AbstractSupport.php          ← version(), upgrade(), output()
    AbstractResponsiveSupport.php
    Renderer.php                 ← single render_block pass
    SupportAssets.php            ← enqueues build/supports/index.js + settings
    Responsive/
      Breakpoints.php            ← option, defaults, validation
      StyleGenerator.php         ← media-query CSS from all supports + responsive variables
      Viewport.php               ← enum: desktop / tablet / mobile
      ValueSanitizer.php         ← preset refs, custom units, shared
  Admin/
    BlocksPage.php
    ResponsivePage.php           ← phase 6
tests/
  fixtures/                      ← shared by PHPUnit and Jest
  Unit/Supports/…, Unit/Supports/Responsive/…, Feature/ResponsiveSupportsTest.php
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
  "replaces": { "spacing": [ "padding", "margin" ] },
  "coreBlocks": [ "core/group", "core/columns", "core/column", "core/cover" ]
}
```

A property's `type` is a ValueSanitizer type name or its options
(`{ "type": "keyword", "values": [ "row", "column" ] }`). Instead of one
`css`, a property can list `rules`, each with `css`, an optional `selector`
appended to the generated class (no commas or braces) and `important`
(default true):

```json
"gap": { "var": "g", "type": "spacing", "rules": [
  { "css": "gap" },
  { "selector": ".is-layout-flow>*+*", "css": "margin-block-start", "important": false }
] }
```

→ `.has-supe-g{gap:var(--supe-g)!important}.has-supe-g.is-layout-flow>*+*{margin-block-start:var(--supe-g)}`.
Panels receive `{ value, onChange, attributes, setAttributes }`; the last
two are for panels tied to a core setting (the layout panel reads the
layout type and writes core's orientation).

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

- `webpack.config.js` builds `supports/index.js` → `build/supports/index.js`
  + `index.asset.php` by convention, alongside the blocks pipeline.
- Controls come from `@supe-editor/components` (one shared script), so the
  supports bundle stays small and depends on `supe-editor-components`.

---

## Security

Every value is written into a `style` attribute, so **PHP sanitizes
everything** before output (`ValueSanitizer`), regardless of what the editor
allowed:

- Preset references: `var:preset|spacing|{slug}` with a slug matching
  `[a-z0-9-]+` → `var(--wp--preset--spacing--{slug})`.
- Custom values: number + `px` | `em` | `rem` | `%` | `vh` | `vw`, or `0`.
  Margin additionally allows negative numbers and `auto`.
- The JS port (`sanitize.js`) applies the same rules, checked against the
  same fixtures, so the editor preview never shows a value PHP would drop.
- Anything else is dropped silently.

---

## Testing

- **Shared fixtures** (`tests/fixtures/`): sanitizer cases, each support's
  render and stylesheet cases — run by PHPUnit and Jest.
- **Unit** (Brain Monkey): `Breakpoints` validation, `StyleGenerator` output
  and registration per `WP_Styles` instance, `Renderer`, upgrades
  (`AbstractSupportTest`), `SupportAssets`.
- **Jest**: the portable modules (from the fixtures), upgrades, the
  no-WordPress-imports rule, responsive utils.
- **Feature**: `render_block` output for a block and a core block;
  attribute registration; the stylesheet reaching every editor canvas
  collection.
- **Manual** (Playwright on supe.test): panel in the Styles tab, device sync,
  canvas styles per viewport, edits stored with `v`.

---

## Phases

1. ✅ **Framework, PHP side** — `Breakpoints` (option + defaults), `ValueSanitizer`,
   `StyleGenerator` (supports **and** responsive variables), `SupportRegistry`,
   `Renderer`, `spacing/support.json` + `support.php`, plus a JS-side
   `ResponsiveControl` usable outside supports. Tests. **Blocks the Slides
   block** (`slides.md`).
2. ✅ **Build + editor wiring** — `supports/index.js`, `SupportAssets`,
   `register-support.js` (attribute / panel / preview filters), portable
   `render.js` / `sanitize.js` / `upgrade.js` with shared fixtures, stored
   value versioning.
3. ✅ **Controls** — `ResponsiveControl` with device-preview sync, breakpoint
   labels and inherited notes; `SpacingSizeControl` wrapping core's control.
4. ✅ **Supe blocks opt in** — `supe/callout` (core spacing removed),
   container.
5. **Core blocks opt in, with the core spacing bridge** — via `coreBlocks`
   plus `bridge.php` + `migrate-core.js` (hide core padding/margin controls,
   migrate existing values). One phase, so a core block never has both.
6. **Settings page** — `ResponsivePage` for breakpoints, with the preview-width
   warning.
7. ~~Core spacing bridge~~ — merged into phase 5.
8. **More supports** — `layout` (gap + flex direction / justify / align)
   and `dimensions` (min height) done 2026-11-27 for the Container
   (`container.md`), adding the `keyword` value type, typed options in
   `type` and multi-rule properties (`rules`) to the framework. Next:
   visibility, …

---

## Open Questions

- Which core blocks go in `spacing`'s `coreBlocks` initially?
- Site setting to disallow custom values (presets only) — needed now or later?
- ~~Should `supe/*` blocks that opt in also set `supports.spacing: false`?~~
  Yes (2026-11-14): they drop core spacing when opting in.
