# Upgrade 2 — Premium Creative Tools

Branch: `feat/upgrade-2-creative-tools`, based on `56909ee`.

## Implemented

- Creative Tools area with lazy-loaded Brand Kit, Photo Backgrounds, Professional Styles and Bulk Create panels. Contextual shortcuts open existing photo adjustment/effect, text and smart-layout controls.
- Multiple browser-local Brand Kits: names/descriptions, primary/secondary logos, 2–8 colors, heading/body/accent fonts, edit/save/select, recoverable deletion and restore. Explicit selection/current-page scopes for colors/fonts/style, plus logo insertion. Design changes use existing undo. Locked/hidden groups are protected. Up to 20 stored kits including deleted kits. Kit metadata is local to this browser; inserted logo assets travel inside design backups.
- Remove Solid BG: original edge-connected color-key processing in a worker; key color/tolerance, preview, cancel/apply, transparent PNG result, preserved original and cutout references, source restore. No model download, external AI calls or remote image fetches.
- Background replacement on transparent photos/cutouts: solid colors, gradients, uploaded/project images and subject position/size controls. Results are derived PNG assets; source and cutout stay preserved so replacement can be repeated. Enable a transparent page background for transparent page PNG exports.
- Color-cast balancing from image midtones, alongside existing Auto Enhance, lighting, highlights/shadows, temperature/tint, sharpness/vignette, portrait/product looks and visual effects. These are deterministic adjustments, not AI retouching.
- Four editable native text looks/presets: Metallic, Chrome, Glass and Raised. Existing gradient/neon/outline/glow/curved typography and connected text fields are retained. Glass/metal effects are gradient/stroke/shadow treatments, not physical material rendering.
- Twelve coordinated style combinations with real artwork previews, scope controls, optional page-background replacement, Apply/Cancel and undo.
- Bulk Create: CSV upload or editable table, quoted/multiline CSV support, explicit text/image column mapping, local filename-based image matching, actual preview, validation before saving, independent editable designs and PNG ZIP export. Mapped connected fields become local overrides; other connections remain. The source is never overwritten, and partial storage failures report saved copies.
- Free/Pro/Experimental product metadata only. All working tools remain available; no billing, fake memberships or browser entitlement enforcement. No copied/relabelled asset packs were added.

## Limits and deferred work

Solid-background removal is NOT general subject segmentation. Hair, complex backgrounds, enclosed holes and ambiguous similar foreground/background colors need manual review; images without a useful removable region are rejected. General semantic background removal and object inpainting are deferred, as are text masks, continuous long shadows and noise reduction. No paint-over object remover is exposed.

Library assessment: [IMG.LY background-removal-js](https://github.com/imgly/background-removal-js) declares AGPL licensing; no code/model from it was bundled. The [Xenova MODNet model card](https://huggingface.co/Xenova/modnet) lists Apache-2.0 and portrait-matting scope. General-scene model integration and output-quality validation remain future work. This upgrade adds no third-party processing dependencies or weights.

Bulk limits: 20 static current-page copies, 20 CSV columns, 64 KB CSV, 20 referenced image files totaling 40 MB, 100 megapixels / 100 MB per exported ZIP. Remote image URLs, curved/vertical text mapping and bulk video generation are not supported. Blank mapped cells, missing images and overflowing text are errors; no prices/data are invented. Individual copies can also use the editor's existing image downloads.

## Focused validation

Five focused Node tests passed: kit persistence/edit/delete/restore, scoped branding/history, CSV replacement, source preservation, worker pixel algorithm, document round trips and editable effects. Full lint identified two errors; both were fixed and targeted lint passed. One production build passed. No extensive browser/device suite was run.

The real browser check used the actual worker, IndexedDB and export pipeline. It verified a transparent PNG corner (alpha 0), preserved foreground RGBA `[40,90,150,255]`, stored kit/logos, unchanged source design, two mapped product designs and a 12,626-byte ZIP containing two distinct 320×180 PNGs. Both decoded PNGs matched their expected generated artwork pixel-for-pixel. Reload restored kit, source/cutout photo references and generated designs. Samples and exact results are in `premium-validation/`.

The development-only fixture is `/dev/creative-validation`; production returns 404. Existing production/Supabase data was untouched, no storage migration or deployment was performed, and Phase 6 was not started.

Preview: run `npm run dev` from `Main`, open `http://localhost:3000/dashboard`, edit a design and choose Creative Tools. Photo properties also provide Solid BG.
