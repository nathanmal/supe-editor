# CLAUDE.md — supe-editor

Package-specific guidance for Claude Code. Package `nathanmal/supe-editor`, which is also the module ID (`Module::id()`). The ecosystem-wide rules (architecture, module pattern, how packages stay connected, what's shared from supe-core, PSR-4 discipline, code style, security, testing) live in `SUPE.md` in the `supe` plugin and are imported here. This directory is a sibling of `../supe`, not inside it, so they would not load otherwise:

@../supe/SUPE.md

This file only adds what's specific to `supe-editor`. When core changes a shared API, the ecosystem file is updated, not this one. Only add something here if it's editor-specific.

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
  Blocks/                BlockRegistrar, BlockCategory, Slides/Markup (shared by the slides render.php files), Slides/Layout (responsive layout variables, `supe.editor.slides`), Slides/Config (engine config → `data-supe-slides`), Slides/Controls (control cells, arrow sets, icons), Slides/Posts (post slides, `supe.editor.slides.posts`)
  Editor/                EditorAssets, HeaderBehavior, PageTemplateMode
  Supports/              SupportRegistry, Renderer, Abstract*Support, SupportAssets
    Responsive/          Breakpoints, StyleGenerator, ValueSanitizer, Viewport
  Admin/BlocksPage.php   "Block Editor" page under the shared Supe admin menu (slug `supe-editor-blocks`)
components/              shared editor components (@supe-editor/components) → build/components/
  responsive/            ResponsiveControl, ViewportSwitcher, useViewport, utils (+ Jest)
  controls/              SpacingSizeControl (wraps core's experimental spacing control)
blocks/{name}/           block source (block.json, index.js, edit.js, save.js, *.scss)
supports/                block supports → build/supports/index.js
  index.js               imports each support
  _framework/            register-support.js (editor filters); sanitize/upgrade/render.js (portable, no WP imports)
  {name}/                support.json + support.php (PHP), index.js + Panel.js (editor)
editor/                  editor modifications bundle → build/editor/
  index.js               imports each modification (+ any editor UI stylesheet)
  canvas.scss            styles inside the editor canvas (create when needed)
  page-title-prompt/     "Name this page" dialog
  header-behavior/       Group panel, document panel, front-end view.js + view.scss
webpack.config.js        wp-scripts default + entries found by convention (see its header)
build/                   compiled output (gitignored — run `npm run build`)
tests/Unit/{Blocks,Editor,Supports,Admin}/, tests/Feature/   mirror src/
tests/fixtures/          cases shared by PHPUnit and Jest (PHP/JS parity)
docs/                    feature plans
```

## Where new things go

- **New block:** `blocks/{name}/` with `"name": "supe/{name}"`, `"category": "supe"`. No PHP needed — `BlockRegistrar` registers everything in `build/blocks-manifest.php`. (`Container` is `supe-container/container` for historical reasons; don't rename it — saved content references the name.)
- **New editor modification (UI/behavior):** `editor/{name}/index.js`, imported from `editor/index.js`. If it needs PHP (attributes, meta, render filters, assets), add `src/Editor/{Name}.php` with `register()`, bind it in `Module::boot()` (`supe.editor.{name}` container id), and add a Unit test in `tests/Unit/Editor/`.
- **Editor styling:** editor UI (sidebars, panels, dialogs) → a stylesheet imported from `editor/index.js` or a modification's `index.js` (`build/editor/index.css`) — never named `style.scss`, which wp-scripts splits into a `style-index.css` nothing loads; the content canvas (iframe) → `editor/canvas.scss` (`build/editor/canvas.css`). Both are loaded by `EditorAssets`, only in the editor.
- **New admin screen:** follow "Shared from supe-core" in the ecosystem file: `src/Admin/{Name}Page.php` extending `AbstractAdminPage` (or `AbstractSettingsPage`), `renderContent()` built with `AdminUi`, `version()` returning `Module::version()`, added with `$this->addAdminPage(...)`. `BlocksPage` is the example. (The `supe_editor` option group used by `Breakpoints` has no settings page yet. If one is added, it extends `AbstractSettingsPage` with that group.)
- **Asset URLs:** `Module::boot()` binds `PackageAssets` for this package as `supe.editor.package` and calls `register()` first, before anything resolves a URL. Existing services still take `SUPE_EDITOR_DIR . 'bootstrap.php'` for `plugins_url()`, which works because of that mapping. New services can take the `PackageAssets` instance instead (`->url()`, `->version()`).
- **New front-end asset for a feature:** `editor/{feature}/view.js` (+ `view.scss` imported from it) is built to `build/{feature}/view.*` automatically; register it from the generated `.asset.php` in the service and enqueue it only where it's used (see `HeaderBehavior::apply()`).
- **Shared component** (used by more than one of blocks / supports / editor): `components/{group}/`, exported from `components/index.js`, imported as `@supe-editor/components` — never by relative path from outside `components/`, or it gets bundled twice. A new `@wordpress/*` import inside `components/` also goes in `components/package.json` `peerDependencies`.
- **New block support:** follow `docs/responsive-supports.md`: `supports/{name}/support.json` (with `"version": 1`, and `replaces` listing any core features it supersedes — a block never has both) + `support.php`, `index.js` calling `registerSupport()`, a `Panel`, and an import in `supports/index.js` plus `SupportRegistry::SUPPORTS`. Add `tests/fixtures/supports/{name}.json` and run it from both PHPUnit and Jest — the PHP and the portable JS must render identically.
- **Changing a support's stored shape:** bump `version` in support.json and add the same migration in PHP (`migrations()`) and JS (`registerSupport( …, { migrations } )`), with fixtures for old values. Additive optional keys don't need a bump.

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
  - `wp-config.php` dev settings: `WP_ENVIRONMENT_TYPE` local, `WP_DEVELOPMENT_MODE` all, `SCRIPT_DEBUG` true, `WP_DEBUG` true with `WP_DEBUG_DISPLAY` false. PHP notices from WP-CLI go to `/Users/nathan/www/vhosts/supe.test/debug.log`; from **web requests** they go to `/Applications/ServBay/logs/php/8.4/errors.log` (the FPM pool pins `error_log`) — check both after changes. FPM's opcache revalidates every 60s, so a PHP edit can take up to a minute to show in the browser.
  - Asset URLs resolve through the Composer install path (`/wp-content/plugins/supe/vendor/nathanmal/supe-editor/build/...`) thanks to supe-core's `PackageAssets`, registered in `Module::boot()` (this used to be `Module::mapSymlinkedInstall()`, promoted to core on 2026-11-23).
  - `?page_id=` URLs redirect to pretty permalinks — follow redirects (`curl -L`) when testing.
  - Its database is `supe_test` — **never** point Feature tests at it. They use `supe_phpunit` with WordPress core in `~/wordpress-core` (7.1.4, no wp-content).
- **Editor testing:** supe.test has an administrator `claude` created for Claude to sign in via `wp-login.php` with Playwright. Where the password lives and how to read it is in `../supe/SUPE.md` ("Dev site sign-in"); don't reset it. If sign-in fails, ask the user to set it again. Never sign in as `nathanmal`. New editor users see the welcome guides (post editor, Site Editor) first.
