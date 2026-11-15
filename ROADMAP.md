# Roadmap — supe-editor

Candidate features for this package, to be prioritized and scoped properly later. Nothing here is committed — this is a parking lot, not a sprint plan.

The package has three focus areas. Suggested order: **housekeeping → supports framework phase 2 → headless contract → blocks (Slides first)**, with editor customization fitted in alongside whenever something becomes a real annoyance.

## Housekeeping

- [x] Git repository.
- [x] Fix `lint:css` (stylelint config with 4-space indentation).
- [x] Feature tests runnable (`tests/wp-tests-config.php` + test database).
- [x] Reorganize by focus area (PHP namespaces, shared JS components, editor UI vs canvas styles, generated build entries).

## Headless contract

Next.js never runs WordPress's PHP render step, so it gets none of the classes, CSS variables or stylesheet added server side. Settle this before building serious blocks:

- [ ] Document how the `supe` attribute's values become classes and CSS variables, readable from data (`support.json`), not only from PHP.
- [ ] REST access to breakpoints and to parsed blocks (core has no parsed-blocks endpoint).
- [ ] Decide whether server-rendered blocks (e.g. Slides) also get a React counterpart.
- [ ] Version the `supe` attribute so its shape can change without breaking saved content on either side.

## 1. Editor customization

Custom functions and add-ons, styling of the editor UI itself, and improvements to how pages look and behave in the editor. Infrastructure in place (`editor/` bundle + `EditorAssets`); shipped so far: page title prompt, header behavior (sticky / hide on scroll), template-locked pages for `supe-blank-page-template` themes.

- [ ] Editor UI styles and canvas styles — plumbing in place (`editor/index.js` stylesheet import / `editor/canvas.scss`, loaded by `EditorAssets`); no styles written yet.
- [ ] Settings screen for the site-wide breakpoints (only a REST setting today).
- [ ] Curation: hide core blocks, features, block variations and styles (`allowed_block_types_all`, `block_editor_settings_all`), possibly per role.
- [ ] Pre-publish checks: missing alt text, skipped heading levels, empty page title.
- [ ] Command palette commands and keyboard shortcuts for frequent actions.
- [ ] Block Bindings API sources for dynamic data (post meta, site options) — headless-friendly since the data lives in attributes.
- [ ] Block style variations / patterns registration (no infrastructure yet).

## 2. Custom & responsive supports

The editor has little responsive support beyond core's `clamp()` fluid values; these add per-viewport overrides where they're needed. Planned in `docs/responsive-supports.md`; phase 1 (server side) done, spacing support defined.

- [ ] Phase 2: build + editor wiring (inspector panel, live canvas preview).
- [ ] Responsive visibility (hide on desktop / tablet / mobile).
- [ ] Responsive typography (font size, line height per viewport; works alongside `clamp()`).
- [ ] Responsive layout (flex direction / stacking, grid columns, order, alignment, gap).
- [ ] Keep the editor's device preview widths (~780 / 360px) consistent with the site breakpoints.
- [ ] Opt core blocks in, and eventually replace core `supports.spacing`.
- [ ] Possibly move header behavior into the supports framework (it's attributes + render-time markup on `core/group`).

## 3. Custom blocks

Blocks that use the custom/responsive supports, referenced by `supe-theme`, with paired Next.js components later.

- [ ] Slides block (`supe/slides`): image/content/post slideshows with responsive layout, control blocks, lightbox — planned in `docs/slides.md` (phase 0 done; phase 1 next).
- [ ] Decide on the front-end script approach for blocks (Interactivity API vs plain JS shareable with Next.js).
- [ ] More blocks beyond `Callout`/`Container`, including a dynamic (server-rendered) example using `render.php`, per the pattern in this module's `README.md`.

See `PROGRESS.md` in this directory for this package's change history and `../supe/TESTING.md` for its testing setup.
