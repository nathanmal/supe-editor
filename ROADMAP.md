# Roadmap — supe-editor

Candidate features for this package, to be prioritized and scoped properly later. Nothing here is committed — this is a parking lot, not a sprint plan.

- [ ] More example blocks beyond `Callout`/`Container` (currently the only two).
- [ ] Dynamic (server-rendered) block example using `render.php`, per the pattern already documented in this module's `README.md`.
- [ ] Editor modifications (the reason for the `supe-blocks` → `supe-editor` rename): editor settings, disabling core blocks/features, editor-only scripts/styles. Infrastructure in place (`editor/` bundle + `EditorAssets`); shipped so far: page title prompt, header behavior (sticky / hide on scroll), template-locked pages for `supe-blank-page-template` themes.
- [ ] Block style variations / patterns registration (no infrastructure for this yet).
- [ ] Responsive block supports (padding/margin first) for `supe/*` and core blocks, with site-wide breakpoints — planned in `docs/responsive-supports.md`.
- [ ] Slides block (`supe/slides`): image/content/post slideshows with responsive layout, control blocks, lightbox — planned in `docs/slides.md` (depends on responsive-supports phase 1).

See `PROGRESS.md` in this directory for this package's change history and `../supe/TESTING.md` for its testing setup.
