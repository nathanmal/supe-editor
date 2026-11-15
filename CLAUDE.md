# CLAUDE.md — supe-editor

Package-specific guidance for Claude Code. The ecosystem-wide rules (architecture, module pattern, PSR-4 discipline, code style, security, testing) are in **`../supe/CLAUDE.md`** — read that first; this file only adds what's specific to `supe-editor`.

Before non-trivial work, read this package's `PROGRESS.md` (current state, open items) and `ROADMAP.md`, plus the relevant plan in `docs/` (`responsive-supports.md`, `slides.md`). Log meaningful changes in `PROGRESS.md` (newest first, terse).

## Scope

`supe-editor` owns **anything that modifies the behavior or UI of the block editor**, plus the front-end behavior that goes with it:

- custom blocks (`blocks/`), including the planned slider block (`supe/slides`, `docs/slides.md`) — slideshows are a standalone block, not a style on core blocks
- block supports and custom block attributes (`supports/`, and attribute extensions like header behavior)
- editor modes and settings, editor UI (panels, dialogs, document sidebar settings) (`editor/`)

### Relationship with supe-theme

`supe-theme` (`../supe-theme`) is presentation only: templates, parts, patterns, `theme.json`, style variations. Editor features that used to live there were moved here (page title prompt, header behavior, template-locked pages). Rules:

- **Never require or call the theme.** The theme tells this package what it needs through **theme supports**; this package checks `current_theme_supports()` and adapts. Current contract:
  - `supe-blank-page-template` — the theme's page template has no Post Title block → `PageTemplateMode` opens pages template-locked (and the page title prompt covers naming them).
- **The theme must keep working without this package** (no header behavior, no prompt, pages open in the normal editor mode).
- Header behavior assumes block-theme markup: the header template part renders as `<header class="wp-block-template-part">` whose first child is the root Group.
- Keep stored names stable once released: block attributes `supeSticky` / `supeHideOnScroll`, meta `_supe_header_behavior`, CSS classes `supe-header-sticky` / `supe-header-hide-on-scroll` / `is-header-hidden`.

## Layout

Organized by the package's three areas — editor customization, supports, blocks — with PHP folders mirroring the source folders (`src/Editor` ↔ `editor/`, `src/Supports` ↔ `supports/`, `src/Blocks` ↔ `blocks/`).

```
src/                     PHP (Supe\Editor\*), one class per file
  Module.php             binds services in the container and registers them (boot())
  SharedComponents.php   registers the shared components script
  Blocks/                BlockRegistrar, BlockCategory
  Editor/                EditorAssets, HeaderBehavior, PageTemplateMode
  Supports/              SupportRegistry, Renderer, Abstract*Support
    Responsive/          Breakpoints, StyleGenerator, ValueSanitizer, Viewport
  Admin/BlocksPage.php   "Blocks" page under the shared Supe admin menu
components/              shared editor components (@supe-editor/components) → build/components/
  responsive/            ResponsiveControl, ViewportSwitcher, useViewport, utils (+ Jest)
blocks/{name}/           block source (block.json, index.js, edit.js, save.js, *.scss)
supports/{name}/         block supports: support.json + support.php
editor/                  editor modifications bundle → build/editor/
  index.js               imports each modification (+ any editor UI stylesheet)
  canvas.scss            styles inside the editor canvas (create when needed)
  page-title-prompt/     "Name this page" dialog
  header-behavior/       Group panel, document panel, front-end view.js + view.scss
webpack.config.js        wp-scripts default + entries found by convention (see its header)
build/                   compiled output (gitignored — run `npm run build`)
tests/Unit/{Blocks,Editor,Supports,Admin}/, tests/Feature/   mirror src/
docs/                    feature plans
```

## Where new things go

- **New block:** `blocks/{name}/` with `"name": "supe/{name}"`, `"category": "supe"`. No PHP needed — `BlockRegistrar` registers everything in `build/blocks-manifest.php`. (`Container` is `supe-container/container` for historical reasons; don't rename it — saved content references the name.)
- **New editor modification (UI/behavior):** `editor/{name}/index.js`, imported from `editor/index.js`. If it needs PHP (attributes, meta, render filters, assets), add `src/Editor/{Name}.php` with `register()`, bind it in `Module::boot()` (`supe.editor.{name}` container id), and add a Unit test in `tests/Unit/Editor/`.
- **Editor styling:** editor UI (sidebars, panels, dialogs) → a stylesheet imported from `editor/index.js` (`build/editor/index.css`); the content canvas (iframe) → `editor/canvas.scss` (`build/editor/canvas.css`). Both are loaded by `EditorAssets`, only in the editor.
- **New front-end asset for a feature:** `editor/{feature}/view.js` (+ `view.scss` imported from it) is built to `build/{feature}/view.*` automatically; register it from the generated `.asset.php` in the service and enqueue it only where it's used (see `HeaderBehavior::apply()`).
- **Shared component** (used by more than one of blocks / supports / editor): `components/{group}/`, exported from `components/index.js`, imported as `@supe-editor/components` — never by relative path from outside `components/`, or it gets bundled twice. A new `@wordpress/*` import inside `components/` also goes in `components/package.json` `peerDependencies`.
- **New block support:** follow `docs/responsive-supports.md` (`supports/{name}/support.json` + `support.php`).

## Conventions specific to this package

- PHP: `declare(strict_types=1);`, PHP 8.1, 4 spaces, camelCase methods, `[ ... ]` arrays. WordPress passes some callback arguments loosely typed (e.g. meta `auth_callback` post IDs) — accept `mixed` and cast instead of type-hinting `int`.
- Keep decisions testable without WordPress: put logic in pure methods (e.g. `HeaderBehavior::resolve()`) and leave `WP_HTML_Tag_Processor` / markup application to Feature or manual tests (same split as `Supports\Renderer`).
- Tidy but readable: no trailing whitespace or whitespace-only lines, braces on the declaration line, aligned `=` / `=>` where neighbouring lines align, sorted `use` imports.
- JS: ES modules + JSX, 4 spaces (`.prettierrc.js`), `npx wp-scripts format <dir>` after edits. **Every imported `@wordpress/*` package must be a devDependency** (lint `import/no-extraneous-dependencies`); they stay webpack externals.
- Names: text domain `supe-editor`; PHP hooks `supe/editor/...` (e.g. `supe/editor/header_behavior/post_types`); JS hook namespaces `supe-editor/...`; script/style handles `supe-...`; meta keys `_supe_...`; block attributes `supe...` (camelCase).

## Commands

```bash
npm run build          # blocks + convention entries (components, editor, views)
npm run start          # watch
npm run lint:js        # all project JS — should be clean
npm run lint:css       # blocks + editor SCSS — should be clean
npm run test:js        # Jest
composer test:unit     # Brain Monkey, no WordPress — should be all green
composer test:feature  # real WordPress: ~/wordpress-core + DB supe_phpunit (tests/wp-tests-config.php, gitignored)
```

## Local development

- **Main dev site: `supe.test`** — `/Users/nathan/www/vhosts/supe.test/httpdocs`, https://supe.test (WordPress 7.1.4). Run WP-CLI from that directory.
  - Symlinks: `wp-content/plugins/supe` → `~/Development/supe`, whose `vendor/nathanmal/supe-editor` → this directory (Composer path repo). PHP changes here are live immediately; JS/SCSS need `npm run build`.
  - Active theme `supe` → `~/Development/supe-theme`.
  - `wp-config.php` dev settings: `WP_ENVIRONMENT_TYPE` local, `WP_DEVELOPMENT_MODE` all, `SCRIPT_DEBUG` true, `WP_DEBUG` true with `WP_DEBUG_DISPLAY` false. **PHP notices only go to `/Users/nathan/www/vhosts/supe.test/debug.log`** — check it after changes.
  - Asset URLs resolve through the Composer install path (`/wp-content/plugins/supe/vendor/nathanmal/supe-editor/build/...`) thanks to `Module::mapSymlinkedInstall()`.
  - `?page_id=` URLs redirect to pretty permalinks — follow redirects (`curl -L`) when testing.
  - Its database is `supe_test` — **never** point Feature tests at it. They use `supe_phpunit` with WordPress core in `~/wordpress-core` (7.1.4, no wp-content).
- **Secondary site: `3ofcupsevents.test`** (`~/www/vhosts/3ofcupsevents.test/httpdocs`) — runs `supe-theme` without the `supe` plugin today; useful to confirm the theme works without this package.
- **Editor testing:** both sites have an administrator `claude` created for Claude to sign in via `wp-login.php` with Playwright. Set a fresh password each session (`wp user update claude --user_pass=... --skip-email`) and keep it out of the repo. Never sign in as `nathanmal`. New editor users see the welcome guides (post editor, Site Editor) first.
