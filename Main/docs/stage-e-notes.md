# Stage E maintenance notes

- v3 projects add `pageVersion: 1`, ordered pages and an active-page identifier. The root canvas/elements mirror the active page so existing tools keep working. v1/v2 files stay unchanged until page creation. Pre-page backups are retained in `legacyPageBackup`; older builds reject v3 rather than silently dropping pages.
- Limits: 20 pages, 100 elements per page, 500 elements per project; existing 30-image/24-megapixel/20 MB document limits remain. Exports are sequential and limited to 100 megapixels and 100 MB combined.
- Page strip supports navigation, add, duplicate, rename, delete, drag ordering, plus menu ordering for touch/keyboard. Existing clipboard copies only active-page selections. Backgrounds, layouts and smart resizing act on the active page.
- ZIP exports contain separate current-format PNG/JPG images. PDFs embed rasterized JPEG pages, with A4 preset sizing at 300 ppi and other sizes at 96 ppi. RGB only: no CMYK/PDF/X, bleed, or vector text. ZIP/PDF byte assembly uses browser APIs without new dependencies.
- Nine three-page starter collections reuse existing editable compositions. Smart resize preserves proportions; six layout variations add pages without modifying the source. Variations require an unlocked, ungrouped source and may need manual fitting. Five coordinated style presets offer color, font and theme operations. A custom user-saved style library is deferred.
- Connected field lookup, updates, campaign detachment/import remapping and portable projects include inactive pages. Page layouts and local overrides are preserved. Only the active canvas is rendered at editing resolution; page previews are lazy and bounded.
- Stage D remains unfinished for background removal, multi-photo collage frames and neon frame glow. No production or Supabase changes.
- Focused compatibility checks are in `tests/pages.test.mjs`. The full regression suite and browser/export visual verification were intentionally skipped in fast mode.

Verification: the five focused tests passed. One production build passed. The single lint check found three unused destructuring variables in the page adapter; these were removed afterward, and lint was not rerun. No browser or rendered PDF/ZIP validation was performed.
