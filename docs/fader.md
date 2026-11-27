# Fader Block — Notes

**Status:** Built 2026-11-26.

A deliberately small sibling of the slider (`docs/slides.md`): images that
crossfade, one after another, filling their container. No content or post
slides, no controls, no transitions to choose — just which images, in what
order, and two timings.

## Blocks

```
supe/fader            ← duration, fade (ms); core aspect ratio / min height, border radius, margin, align
 └─ supe/fader-image  ← id, alt (overrides the library's), focalPoint
```

Both dynamic (`render.php`); the fader's save is `<InnerBlocks.Content />`,
the image's `null`.

## Front end

- The images share one grid cell, so the fader is as tall as its tallest
  image, or as core's **aspect ratio / min height** say; every image
  covers it at full width (`object-fit: cover`, focal point →
  `object-position`). `wp_get_attachment_image( 'full' )` gives the srcset, so
  the browser picks the resolution.
- `Blocks\Fader::prepare()` marks the first image `is-active` and hides the
  others from assistive tech; `timing()` validates `duration` (1–60s,
  default 5s) and `fade` (0.1–10s, default 1.5s), written as
  `data-supe-fader` and `--supe-fader-fade`. Mirrored by
  `blocks/fader/timing.js`; both run `tests/fixtures/fader-timing.json`.
- `view.js` (script module): every `max( duration, fade )` the next image
  becomes `is-active` and fades in **over** the current one, which turns
  `is-previous` and stays opaque underneath — no dip to the background
  mid-fade. Waits while the tab is hidden or the fader is off screen.
  Reduced motion (or no script): the first image stays.

## Editor

- Empty: a centered media placeholder ("Choose the images to fade between")
  — the one prompt drawn in the canvas. The (empty) inner blocks still
  render: they register the allowed blocks, without which the chosen images
  can't be inserted.
- The canvas shows one image: the first, or the one being edited (a scoped
  `<style>` hides the rest).
- **Play preview** (Timing panel, 2+ images; `edit/use-preview.js`, never
  saved): cycles the images in the canvas with the block's timing. The fade
  is a CSS animation from transparent (`supe-fader-preview`, editor.scss),
  so it also runs for an image that was the opaque one underneath. Stop
  cancels the next change (a running fade finishes, the canvas stays on that
  image); Play waits a full turn again. Selecting an image stops it and shows
  that image. Adding, removing or reordering images while it plays keeps the
  image showing and the time to the next change (it continues with whatever
  follows that image now; a removed image falls back to the first); while
  stopped, reordering goes back to the first.
- Sidebar: **Images** (thumbnails; drag, move up/down, remove, click to edit,
  Add images via the gallery flow) and **Timing** (seconds). Each image's
  sidebar: focal point, alt text, Replace in the toolbar, and the "Select
  fader" icon beside its title.

## Shared with the slider (`blocks/shared/`)

`SortableBlockList` (sidebar rows: drag, move, select, optional remove),
`SelectParentButton`, `AddImages` (gallery flow into any parent),
`use-media` (records + thumbnails), `drop-index`, `use-media-select`, and
their styles in `sidebar.scss` (imported by each parent block's `index.js`,
since child blocks have no editor stylesheet).
