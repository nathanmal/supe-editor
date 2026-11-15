# Supe Editor

**Block editor module for the Supe ecosystem: custom Gutenberg blocks plus
modifications to the editor itself.**

Supe Editor is a [Supe](../supe) module: it doesn't run as a standalone WordPress
plugin, it self-registers into the `supe` host plugin's module registry and
boots alongside every other `supe-*` module.

It owns everything that changes how the block editor behaves or looks — custom
blocks, block supports, editor UI and editor settings — while
[`supe-theme`](../supe-theme) stays presentation only (templates, patterns,
`theme.json`).

---

## Features

### Blocks

- Auto-discovery and registration of every compiled block in `build/`
  (`Blocks\BlockRegistrar`, from `build/blocks-manifest.php`)
- A shared `"supe"` block category (skipped if something else already
  registered it)
- **Callout** (`supe/callout`) — working example of the full
  source → build → register pipeline
- **Container** (`supe-container/container` — predates the `supe/` naming; kept so saved content keeps working)
- A read-only **Blocks** admin page under the shared Supe menu listing every
  registered block (`Admin\BlocksPage`)

### Shared components

`components/` holds editor components used by blocks, supports and editor
modifications alike (e.g. `ResponsiveControl`). It's built once as the
`supe-editor-components` script (`window.supeEditor.components`, registered by
`SharedComponents`); everything else imports it as `@supe-editor/components`,
and webpack turns that import into a script dependency instead of bundling a
copy — the same way `@wordpress/*` packages work.

### Editor modifications

Built from `editor/` into one bundle (`build/editor/index.js`), enqueued in
every block editor by `Editor\EditorAssets`. Styles:

- **Editor UI** (sidebars, panels, dialogs): import a stylesheet from
  `editor/index.js` → `build/editor/index.css`, loaded with the bundle.
- **Editor canvas** (the content iframe): `editor/canvas.scss` →
  `build/editor/canvas.css`, loaded in the editor only.

- **Page title prompt** (`editor/page-title-prompt/`) — a "Name this page"
  dialog when an untitled page opens with "Show template" on (the template has
  no Post Title block, so there's nowhere on the canvas to type one). Shows once
  per load, after any other dialog (welcome guide, "Choose a pattern") closes;
  sets the title with `editPost()`.
- **Header behavior** (`Editor\HeaderBehavior`, `editor/header-behavior/`) —
  sticky / hide-on-scroll site header:
  - Default: "Header behavior" panel on the header template part's root Group
    (Sticky, then Hide on scroll).
  - Per-page override: "Header" panel in the document sidebar — Default, Static,
    Sticky, or Sticky + hide on scroll.
  - Front end: CSS/JS from `build/header-behavior/view.*`, loaded only on pages
    where the header is sticky / hides. Stays visible while anything in it has
    keyboard focus; no animation with reduced motion.
- **Template-locked page editing** (`Editor\PageTemplateMode`) — pages open
  with "Show template" on when the active theme declares
  `add_theme_support( 'supe-blank-page-template' )`.

### Responsive block supports

Custom block supports with per-viewport values — desktop is the default,
tablet and mobile override it at the site-wide breakpoints. See
[`docs/responsive-supports.md`](docs/responsive-supports.md).

- **Responsive spacing** (`supports/spacing/`) — padding and margin, with the
  theme's spacing presets first and custom values in the theme's units. A
  "Responsive spacing" panel in the block's Styles tab, with one device
  switcher synced to the editor's preview. Used by Callout and Container
  (`"supports": { "supe": { "spacing": true } }`).
- Rendered at request time (classes + CSS variables on the block, one
  generated stylesheet with the breakpoints' media queries) — saved markup
  never changes.
- Stored values are versioned (`v`) and upgraded on read.
- `supports/_framework/{sanitize,upgrade,render}.js` render the same
  `support.json` without WordPress, for headless front ends; shared fixtures
  in `tests/fixtures/` keep them identical to the PHP.

### In progress / planned

- **Slides block** (`supe/slides`) — the slider/slideshow block. See
  [`docs/slides.md`](docs/slides.md).

---

## Working with themes

The package never calls the theme; themes opt in to behavior with theme
supports, and must keep working without this package.

| Theme support | Effect |
|---|---|
| `supe-blank-page-template` | Pages open template-locked in the editor (`PageTemplateMode`); pair with the page title prompt. Declared by `supe-theme`. |

Header behavior expects a block theme header: a template part rendered as
`<header class="wp-block-template-part">` whose first child is the root Group.

---

## Reference

| Kind | Name | Notes |
|---|---|---|
| Filter | `supe/editor/header_behavior/post_types` | Post types with the per-page header override. Default `[ 'page', 'post' ]`. |
| Post meta | `_supe_header_behavior` | `''` (use header default), `static`, `sticky`, `hide-on-scroll`. REST-exposed, `edit_post` capability. |
| Block attributes | `supeSticky`, `supeHideOnScroll` | Added to `core/group` (server and client). |
| CSS classes | `supe-header-sticky`, `supe-header-hide-on-scroll`, `is-header-hidden` | Root Group / `<header>` wrapper. |
| Script / style handles | `supe-editor` (editor bundle + UI styles), `supe-editor-canvas` (canvas styles), `supe-editor-components` (shared components), `supe-editor-supports` (block supports editor script), `supe-header-behavior` (front end), `supe-responsive` (generated responsive CSS) | |
| Block attribute | `supe` | Every support's value, keyed by support name, each with its shape version `v`. |
| JS global | `window.supeEditor` | `.components` (shared components), `.settings.breakpoints` (supports script). |
| Theme support | `supe-blank-page-template` | See above. |
| Option | `supe_editor_breakpoints` | Tablet / mobile max widths for responsive supports. |

---

## Installation

```bash
composer require nathanmal/supe-editor
npm install
npm run build
```

`supe` must be active as a WordPress plugin before this module boots.
`build/` is not committed — nothing is registered or enqueued until it's built.

---

## How It Works

```
blocks/{name}/block.json, index.js, edit.js, save.js   ← you write this
components/index.js                                    ← shared components
editor/index.js (+ editor/{feature}/..., editor/canvas.scss)
                    │
              npm run build   (wp-scripts + webpack.config.js)
                    ▼
build/{name}/block.json, index.js, index.css, ...       ← compiled blocks
build/blocks-manifest.php                              ← every block.json, as one PHP array
build/components/index.js + index.asset.php            ← shared components
build/editor/index.{js,css}, canvas.css + .asset.php   ← editor bundle, UI + canvas styles
build/header-behavior/view.{js,css} + view.asset.php   ← feature front end
                    │
        supe/before_boot → registry->register(Module::class)
                    │
        Module::boot() → services' register()
                    │
        SharedComponents:        register supe-editor-components on init
        Blocks\BlockRegistrar:   wp_register_block_types_from_metadata_collection(...)
        Editor\EditorAssets:     editor bundle + UI styles; canvas styles
        Editor\HeaderBehavior:   attributes, meta, render filters, front-end assets
        Editor\PageTemplateMode, Supports\* (+ Supports\Responsive\*), Admin\BlocksPage
```

Blocks are built with `--webpack-src-dir=blocks --blocks-manifest`, which only
discovers directories containing a `block.json`. Everything else is found by
convention in `webpack.config.js` (`components/index.js`, `editor/index.js`,
`editor/canvas.scss`, `editor/{name}/view.js`, `supports/index.js`) — an entry
exists once its source file does, and each gets its own `.asset.php` with
dependencies and a version hash.

---

## Adding a New Block

1. Create `blocks/my-block/` with at least `block.json`, `index.js`,
   `edit.js`, and `save.js` (copy `blocks/callout/` as a starting point).
2. Use `"name": "supe/my-block"` and `"category": "supe"` in `block.json`.
3. Run `npm run build` (or `npm run start` while developing).
4. That's it — `BlockRegistrar` picks up `my-block` from the regenerated
   `build/blocks-manifest.php` on the next `init`.

For a dynamic (server-rendered) block, add a `render.php` next to
`block.json` and reference it with `"render": "file:./render.php"` —
`register_block_type()` picks it up automatically.

## Adding an Editor Modification

1. Create `editor/my-change/index.js` and import it from `editor/index.js`.
2. If it needs PHP (attributes, meta, render filters, assets), add
   `src/Editor/MyChange.php` with a `register()` method, bind it in
   `Module::boot()`, and add a Unit test.
3. If it needs its own front-end script/style, add `editor/my-change/view.js`
   (it's built to `build/my-change/view.*` automatically) and enqueue it only
   where it's used.
4. Run `npm run build`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Production build: blocks, editor bundle, feature front-end entries → `build/` |
| `npm run start` | Watch mode for development |
| `npm run lint:js` | Lint all project JS (`build/`, `node_modules/`, `vendor/` ignored) |
| `npm run lint:css` | Lint SCSS in `blocks/` and `editor/` (`.stylelintrc.json`, 4 spaces) |
| `npm run test:js` | Jest unit tests |
| `npm run format` | Format source with `wp-scripts format` (4 spaces, `.prettierrc.js`) |

---

## Testing

```bash
composer install
composer test:unit      # Brain Monkey, no WordPress needed
composer test:feature   # boots real WordPress — one-time setup in ../supe/TESTING.md
npm run test:js         # Jest
```

Unit tests cover the services' decisions (block registration, assets,
header behavior resolution, meta sanitizing, page template mode, responsive
breakpoints / sanitizing / CSS generation, supports). Applying markup changes
(`WP_HTML_Tag_Processor`) needs real WordPress and belongs in Feature tests.

See [`supe-core`'s README](../supe-core#testing) for the full Unit vs. Feature
testing pattern shared by every Supe module.

## Requirements

- PHP 8.1+
- WordPress 6.8+ (`wp_register_block_types_from_metadata_collection()`)
- Node 18+ (for building assets)
- The `supe` plugin, active

## License

MIT
