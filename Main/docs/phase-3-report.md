# Comvexa — Phase 3 core editor completion report

## Library and architecture

React Konva 19.3.2 with Konva 10.9.1. A disposable Konva/Fabric browser spike loaded cropped images, selection/transform controls, text input and successful PNG/JPG encoding. Fabric has built-in Textbox editing; Konva requires a native textarea overlay. Konva was selected for React integration and an explicit adapter around our application data. See [decision and architecture](editor-architecture.md). The prototype route and Fabric dependency were removed. Prototype touch and full persistence comparisons were not exhaustive; touch was subsequently checked in the actual editor.

## Implemented

- Standalone design library at `/editor`; create at `/editor/new`. Existing dashboard projects open the editor with their project ID and initial preset. Documents remain separate from planning metadata, so renaming/resizing artwork does not rename/resize its planning draft.
- Neutral light/dark workspace, tool panels, responsive bottom sheets, canvas viewport scrolling, fit/zoom, preview, contextual properties, selection handles, rotation, edge/center snapping guides.
- Text insertion, native on-canvas editing by double-click/double-tap or Edit on canvas, four system font families, size/weight/alignment/line-height/color/opacity.
- Rectangle and ellipse insertion, fill/stroke/stroke width, rectangle corner radius, geometry and opacity controls.
- Local PNG/JPEG/WebP upload, replacement, source crop controls, center/reset crop, sizing and optional aspect lock. Images are decoded and re-encoded locally; no uploads or remote URLs.
- Duplicate/delete, layer reorder/select, lock/unlock; up to 30 undo snapshots with a 48 MB unique-image-source history budget. History resets on reopen.
- Canvas presets for Instagram square/portrait/story, Facebook, A4 portrait/landscape, custom 64–4096 px dimensions and background color. A4 is nominal 300 ppi raster sizing; no bleed, CMYK or print metadata guarantee.
- Debounced autosave (800 ms), manual save, saving/saved/error states, beforeunload protection for unsaved document changes, and save-before-return through the editor brand link. Portable JSON download/import embeds images and validates before applying. Import and starter replacement are undoable.
- PNG and JPG exports from a separate artwork-only stage at exact document dimensions. JPG quality 80/92/100%; PNG is lossless. Background included; no guides, controls, selection handles or watermarks. Font readiness and image decoding are awaited.
- Two simple editable starter layouts; full template library/application remains Phase 4. No full connected-content UI.

## Document schema

Application schema version 1 (not Konva serialization):

```json
{
  "schemaVersion": 1,
  "name": "My design",
  "canvas": { "width": 1080, "height": 1080, "background": "#ffffff" },
  "elements": [],
  "assets": {},
  "bindings": []
}
```

Every element has `id`, `type`, `x`, `y`, `width`, `height`, `rotation`, `opacity`, `locked`, optional nullable `{campaignId, fieldId}` binding, and explicit `localOverride`. Text elements contain text and typography; image elements reference embedded assets and normalized source crop; shapes contain fill/stroke/radius. Array order is back-to-front. Binding data is preserved without changing layout; propagation is deferred. The original blank-document helper remains compatible.

Validation restricts types, IDs, finite geometry, hex colors, text lengths, fonts, crop bounds, 100 elements, 30 assets, a 24-megapixel combined image budget and 20 MB portable/document bytes. Unknown versions and remote image sources fail closed. Imported assets receive signature checks and actual browser decoding. SVG/HTML/GIF and animated PNG/WebP are unsupported. Input files are limited to 8 MB and 4096 px per edge, then optimized to a maximum 2048 px edge locally.

## Saving and limitations

IndexedDB database `comvexa-designs-v1`, store `designs`, stores `{id, document, revision, updatedAt}`. Transactions compare expected revisions to prevent silent multi-tab overwrites. Failed writes preserve the previous record. Future cloud persistence can implement the same adapter contract. Local data is shared within the browser profile/origin, unencrypted and subject to clearing/eviction/quota. There is no cloud authentication, sync or backup. Download project files for backup. Storage-open failures can use an explicitly unsaved in-memory design; unreadable existing designs are preserved rather than overwritten.

Autosave and exit prompts reduce accidental loss; browsers can still terminate without an unload event, and the debounce interval is not a durability guarantee. An unfinished text overlay or uncommitted design-name field must be committed by blur/Enter before leaving. The editor intentionally supports single selection, not groups or multi-selection. Resizing text changes its text box; font size is a separate control. Crop is numeric/center/reset rather than a drag-to-pan crop mode. No pinch zoom, custom font upload, rich text, PDF, CMYK, collaboration or reusable asset library. System font availability can differ by device. No real-device, Safari/Firefox, screen-reader or sustained performance certification was performed.

## Tests and results

- ESLint: passed with zero warnings.
- Automated tests: 19 passed, including 8 editor tests covering document creation/validation, element editing/move/resize/rotation, history, layer order, snapping, IndexedDB roundtrip/conflicts/failure, image validation, export dimensions and quota rollback. Existing auth, workspace, PostgreSQL RLS and motion tests remain passing.
- Production Next build: passed; renderer stays in the lazy client editor route.
- HTTP smoke: 15 checks passed (11 HTML routes including editor, 3 fail-closed cloud API routes, unknown 404).
- npm audit: zero known vulnerabilities.
- Native Edge desktop: text insertion, on-canvas typing, duplicate, local save/reload, upload of original travel WebP, crop, drag and resize checked. Nested-anchor hydration warning and oversized handles found during development were corrected.
- Edge smartphone emulation: 375 × 667 and 440 × 956 layouts; light/dark, bottom sheets, select/drag/resize without page scrolling, export sheet and PNG download checked. The downloaded PNG was independently decoded as 1080 × 1080 and visually inspected for artwork-only content. QA artwork deliberately includes duplicate overlapping text from the duplication test.
- Portable JSON downloaded, structurally validated, imported into a different blank editor ID, saved, and reopened with its embedded image after reload.
- Disposable browser export assertions rendered actual PNG and JPG, decoded both at 320 × 240, sampled background/shape/ellipse/image pixels and detected rendered text. SVG upload rejected. Fixture retained at `tests/browser/export-fixture.js`; it is not a public application route or part of the Node test count.
- Browser console included installed-extension errors. Full browser matrix and actual mobile OS file-picker/keyboard behavior remain verification limits.

## Files

New: `src/app/editor/page.js`, `src/app/editor/[id]/page.js`; `src/features/editor/{editor-loader,editor,design-canvas,properties-panel}.js`, `editor.css`; `src/lib/editor/{document,images,store,export}.js`; `tests/editor.test.mjs`, `tests/browser/export-fixture.js`; `docs/editor-architecture.md`, this report.

Modified: package manifest/lock (Konva, React Konva, test-only fake-indexeddb); shared brand supports a configurable destination; dashboard project detail/navigation/empty-state copy; README; HTTP smoke paths; two homepage availability sentences. Approved homepage structure, illustrations, themes and animations were preserved. No database migration, Supabase connection, credentials, production deployment or domain changes.

## Preview and Phase 4 recommendation

Run `npm run dev` from Main and open http://127.0.0.1:3000/editor. Create a design, add text/shapes/images, change properties, save, download a project file, export, return to the library and reopen. Existing dashboard project detail pages also offer Open design editor. Temporary verification servers are stopped at handoff.

Before Phase 4, review the editor on physical Android/iOS devices and expand regression coverage for touch/IME, rotation and print exports. Phase 4 should build validated reusable templates and application flows over this document model, followed by asset management and controlled font support. Connected-content propagation remains reserved for Phase 5. Phase 4 has not begun.
