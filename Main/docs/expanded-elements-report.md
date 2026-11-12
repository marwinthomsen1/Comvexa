# Expanded Elements library

The Elements panel now offers **79 editable elements** instead of two: 18 basic shapes, 10 badges/stars, 10 arrows, 13 symbols, 8 nature graphics, 10 decorations and 10 business graphics. This focused upgrade is based on `f28d463`, on branch `feat/expanded-elements`. It does not begin unrelated development stages or change production/Supabase.

The panel includes keyword search, category filtering, a color picker with matching live previews, named tooltips and a popular-first default order. The compact three-column desktop grid and four-column mobile grid replace the two oversized tiles and the Stage C placeholder. A graphic can be inserted, recolored, outlined, moved, resized, rotated, duplicated, grouped, layered and exported. Graphic names appear in selection properties and layer search. Graphic aspect ratios are preserved by default during corner resizing; Alt allows free resizing, following the existing image interaction.

All new artwork is original application-owned vector geometry. No remote images, proprietary icon packs, external fonts or stock assets are needed. There are six primitive presets and 73 distinct vector paths. Only a validated preset identifier is persisted, never arbitrary SVG markup or executable path content. Catalog definitions must remain stable for saved projects.

## Architecture

- `src/lib/elements/catalog.js`: 79 descriptors, original geometry and search/category matching.
- `bounds.js`, `render.js`: exact path bounds and shared Konva path attributes. Parent groups own document transforms; child paths normalize artwork into exact document frames. The editor and PNG/JPG exporter use the same attributes.
- `insert.js`: centered, canvas-safe insertion using current document state and the existing immutable insertion/history path.
- `src/features/editor/element-library.js` and `editor.css`: responsive searchable picker, native color input and accurate inline vector previews.
- `editor.js`, `studio-tools.js`, `properties-panel.js`, `design-canvas.js`: insertion, named layers, fill/border controls and aspect-preserving vector transforms.
- `src/lib/editor/document.js`: additive optional `graphicKind` on schema-v2 rectangle elements. Unknown identifiers and invalid element/version combinations are rejected. The existing four element types and ordinary v1/v2 documents retain their previous meanings.
- `src/lib/editor/export.js`: native vector path export, including holes and curved paths.
- `scripts/build-element-bounds.mjs`: regenerate exact bounds after authoring geometry; tests detect stale values.

Existing v1 projects are not rewritten on load. Inserting a vector uses the established v2 upgrade/save mechanism and preserves the existing pre-upgrade v1 backup. Grouping, clipboard, layers, connected fields, local saving and history continue using their existing contracts. Saved graphic projects need this application version or newer; earlier versions do not understand the new preset field. Export a project backup before opening it in an older build.

## Validation

- **73 automated tests pass**, including six new element tests. All 79 insert at safe sizes on both 64px and 1080px canvases. Tests validate IDs, unique vector paths, search, style editing, exact renderer bounds, save/reopen, group transforms, undo/redo, clipboard transfer and v1 upgrade backups. Malformed/imported graphic identifiers are rejected. Existing template, transform, connected-design, access and authentication tests remain passing.
- **79/79 actual browser render/export checks pass in Safari**, producing 158 PNG/JPG exports. The browser decodes each output, verifies 320×320 dimensions and checks nonempty graphic pixels. The rendered collection was visually inspected, including curves, hollow paths, arrows, badges and business symbols. The dot grid and semicircle proportions were refined during review and the full run repeated.
- Desktop browser: searched “heart”, inserted a native heart, inspected fill/border properties, dragged, corner-resized and rotated it with the existing transform controls. The selection box followed the artwork correctly.
- Mobile viewport: a real same-origin editor iframe measured **388px viewport and 388px document width**, with 79 buttons arranged in four 79.5px columns. The mobile tool sheet opened and a lightning bolt was added; its editable properties appeared and canvas count increased from 1 to 2. This is desktop-browser viewport testing, not physical touch-device testing.
- Lint and production build pass. All 17 production HTTP smoke checks passed on a separate loopback server at port 3001.

Browser fixtures are retained outside application routes in `tests/browser/elements-acceptance-fixture.js` and `elements-mobile-fixture.js`. To reproduce, temporarily copy them to `src/app/elements-qa/page.js` and `src/app/elements-mobile-qa/page.js`, run the dev server, open each route, and click the acceptance button or Elements tool. Remove the temporary routes before a production build. The export fixture creates no persistent test designs; the mobile fixture opens a new browser-local test canvas.

## Preview and limits

Open `http://127.0.0.1:3000/editor/new`, select **Elements**, then search or select a category. Existing editor tabs may need a refresh after their changes are saved.

The collection is single-color vector artwork with an optional separate outline; it does not add arbitrary SVG importing, path-point editing, multicolor illustration recoloring or new export formats. Individual graphic geometry is a fixed preset while colors, stroke, position, scale, rotation, opacity and layer behavior remain editable. Physical mobile testing remains outstanding. No external service, credential or production configuration is required.
