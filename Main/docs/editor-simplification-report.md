# Editor simplification

Implemented on `feat/editor-simplification`, preserving Stage C baseline `e8905bb`. No production, domain, or Supabase changes.

## Interface changes

| Before | After |
| --- | --- |
| Large action cards and repeated selection tools | Compact Lucide contextual actions and a More selection menu |
| Long typography form | Font, size, color, bold/italic/underline, alignment and effects first; advanced controls collapsed |
| Technical crop percentages as the main interface | On-canvas crop area with drag, corner resizing, ratio lock, Apply, Cancel and Reset |
| Large independent-content explanation | Compact connection indicator opening the existing binding controls; help on demand |
| Expanded canvas and backup settings | Relevant settings and expandable advanced sections |

Photo controls expose Crop, Replace, Adjust, Effects and More. Brightness, contrast, saturation and warmth have live sliders. Five presets include Original, Vivid, Warm, Black & white and Vintage. Existing typography, templates, elements, grouping, transforms, connected content and export paths remain available.

## Crop and rendering architecture

Crop edits remain a temporary ref-backed draft. Pointer movement paints the DOM overlay through requestAnimationFrame, without modifying the document or autosave on every move. Apply creates one history change; Cancel discards the draft. Coordinates account for image rotation and zoom. Keyboard arrows move the crop and resize focused corner controls. Reset uses the existing cover fitting calculation.

Photo adjustments are optional validated v2 image metadata. Existing v1 documents still load. Source assets remain original; preview and export share the same pixel adjustment function. Style value keys prevent image reprocessing on unrelated document updates. Adjustment sliders debounce document updates by 100ms and flush on release/blur. Existing native Konva transform sessions remain intact.

## Files

- Editor interface: `editor.js`, `editor.css`, `properties-panel.js`, `selection-controls.js`, `typography-controls.js`, `connection-panel.js`, `studio-icon.js`.
- Photo interface: new `photo-controls.js`, `photo-crop.js`; canvas integration in `design-canvas.js`.
- Data/rendering: new `crop.js`, `photo-style.js`; updates to `document.js`, `images.js`, `export.js`.
- Verification: `tests/photo-tools.test.mjs`; two manual browser fixture sources in `tests/browser/editor-simplification-*.js`.

## Validation

- ESLint: passed, zero warnings.
- Automated suite: 90/90 passed, including eight new photo/crop tests covering clamping, aspect ratios, inverse rotation/zoom, history, pixel processing, validation, persistence, clipboard and connected compatibility.
- Production build: passed.
- Production localhost HTTP smoke checks: 17/17 passed, including authentication API fail-closed behavior.
- Safari desktop: inspected compact photo panel, visual crop movement and Apply, selected text, changed Arial to Georgia and confirmed font picker closes. Light and dark interfaces inspected.
- Browser rendering fixture: five photo styles saved/reopened; ten PNG/JPG exports decoded successfully. All five PNG comparisons against the canvas had zero differing pixels at the fixture's channel tolerance (6).
- Mobile-width Safari iframe (390 × 800): selected text and opened the contextual sheet; essential typography controls visible together, with advanced sections below. This is viewport testing, not a physical touch-device test.
- Temporary application QA routes and debug controls removed; fixture sources retained outside app routing.

## Preview

Run `npm run dev` in Main and open http://127.0.0.1:3000/editor. Open a design, select text for compact essentials, or select a photo and choose Crop. Drag inside or use corners, then Apply or Cancel. Adjust and Effects open the new photo controls. Download retains PNG/JPG export and the collapsed project backup section.

## Limitations

Physical iOS/Android touch behavior and a fresh end-to-end replacement/file-picker workflow were not verified in this pass. Existing automated coverage for connected content, grouping and document compatibility passes; these workflows were not all repeated manually. There is no browser FPS benchmark. Cropping uses a rectangular source area, without perspective or freeform masks. Very zoomed or off-canvas images can require Fit/panning to reach their crop controls. Continuous adjustment sliders may produce multiple undo entries; a crop Apply produces one.

No unrelated stage was started.
