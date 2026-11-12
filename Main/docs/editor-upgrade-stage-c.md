# Stage C — Typography & Text Effects

Implemented on `feat/stage-c-typography`, based on preserved commit `af4f941`. No deployment, live domain, Supabase or unrelated stage changes.

## Delivered

- **54 available fonts:** 50 curated open-source families plus Arial, Georgia, Verdana and Courier New. The 50 families include 20 sans-serif, 10 serif, 10 display, 6 handwritten and 4 script choices. Search, categories, live previews, pagination and six recently used families are included.
- Local, on-demand WOFF2 loading with shared promise caching and explicit retryable errors. Font previews load only as their rows become visible; only eight rows initially mount. Selecting a font/weight waits for that face before changing the document. Project load, import, paste, connected refresh and export wait for required fonts. The full collection is **84 font faces / 2,828,472 bytes**, not an up-front gallery download.
- Font family, size, regular/bold, italic, underline, letter spacing, line height, left/center/right alignment, fill color, opacity, text-box dimensions and rotation. Icons use the existing Lucide system; spacing/effects/presets are expandable and work inside the existing mobile sheet.
- Editable shadow, outline, glow, crisp offset shadow, neon and two-color linear gradient text. Controls include colors, outline width, blur, intensity, X/Y offset and gradient angle. These remain native Konva Text objects, not flattened images.
- **10 one-click styles:** Modern headline, Luxury title, Minimal subtitle, Neon title, Retro advertisement, Elegant invitation, Bold sale announcement, Editorial heading, Chromatic headline and Personal note. Applying a preset fits its font size to the existing text box without replacing content or connections. Styles remain customizable.
- Direct text editing retains italic/underline/spacing in the input. A browser-found focus timing issue was fixed so typing replaces the selected content rather than appending unexpectedly. Box width/height controls rewrap text; corner handles preserve proportional scaling.

## Compatibility and rendering

Advanced styling is an additive, validated `textStyle` object on schema-v2 text elements. Ordinary saved v1/v2 designs and the 79-element collection remain unchanged. Applying effects/advanced formatting uses the existing v2 upgrade mechanism, including a pre-upgrade backup. No database migration or destructive rewrite was added.

The renderer and exporter share `textStyleAttributes`; effect dimensions scale with font size during group and pointer transforms. No font fetching, effect state writes or additional React rendering was added to gesture frames. Undo/redo, portable projects, clipboard and connected content retain the full styling. Changing a shared campaign value replaces text while preserving font/effects; style changes alone do not create a local text override.

Required fonts must load before rendering/import/export. A missing font produces an error instead of silently exporting a fallback. Fonts are local application assets, rather than external runtime requests. Font files are not embedded in portable project JSON: reopening requires this app's bundled assets. Old app versions may not understand the new fonts/styles; use the current build for these projects.

## Sources and licenses

The collection was retrieved from Google Fonts' official CSS/font delivery endpoints. Every family has its corresponding upstream `OFL.txt` under `public/fonts/<family>/`. `src/lib/typography/fonts.json` records each source URL, file size, weight and SHA-256. `scripts/fetch-typography-fonts.py` is a manual refresh tool; build/runtime never downloads the collection. No package dependency or paid service was added.

Google Fonts permits self-hosting subject to each family's license: [official repository](https://github.com/google/fonts). The selected files and included notices use SIL Open Font License 1.1. Rendering follows the existing [Konva Text API](https://konvajs.org/api/Konva.Text.html).

## Validation

- **82 automated tests pass**, including nine focused typography tests: local faces/licenses/checksums, font search/loading/cache/retry, style validation, ten presets, save/reopen, clipboard, undo/redo, group/pointer effect scaling, connected updates/override/restore, portable projects, preset fitting and upgrade backups. Existing editor, 79 elements, 100 templates and access tests remain included.
- Lint: zero warnings. Production build: pass. All **17 production HTTP smoke checks passed** on a separate loopback server. All **84 font URLs** returned valid WOFF2 files; both temporary typography QA routes returned 404.
- Safari loaded all **50 families / 84 faces**. All ten presets saved and reopened, then produced **20 decoded PNG/JPG exports**, each 800×450 pixels. Visual inspection covered all ten exported styles, including neon, outline, offset, italic, script and gradient.
- The real DesignCanvas stage was compared with each decoded PNG at matching document bounds/pixel ratio. All **10 comparisons had zero differing pixels** under the defined summed-channel tolerance of 6. No statement is made about all possible text/font/browser combinations.
- Real editor checks: searched/applied Caveat, italic and underline, edited gradient colors/effect, verified undo/redo, and replaced content directly on canvas. The saved replacement text was visible in the reopened phone-width editor.
- Mobile layout: **388px viewport and 388px document width**, font selector and formatting controls present. Light and dark sheets were visually inspected. Testing used desktop Safari with a true narrow iframe viewport; physical mobile devices and low-end-device FPS were not tested.

Recorded results: `docs/typography/browser-results.json`. Reproduction fixtures live outside application routes: `tests/browser/typography-acceptance-fixture.js` and `typography-mobile-fixture.js`. Temporarily copy them to matching `/typography-qa` and `/typography-mobile-qa` app pages for local QA. The full fixture creates disposable local test designs; use a dedicated browser profile. Its pixel comparison uses the actual editor stage and actual exporter. Remove the routes before production builds. The mobile fixture starts a new canvas; add/select text and open Selection properties before measuring.

## Files

`src/lib/typography/{fonts.json,fonts.js,style.js,presets.js}`; `public/fonts/` (84 faces and 50 licenses); `src/features/editor/typography-controls.js`; existing `properties-panel.js`, `design-canvas.js`, `editor.js`, `editor.css`; `src/components/ui/studio-icon.js`; document validation, export, group/pointer transform and text-fitting modules; typography tests, browser fixtures, source download script and this report.

## Deferred and remaining limits

- **Curved/circular text is deferred**, as explicitly permitted in the brief. It needs a dedicated path-layout pass to keep multiline wrapping, selection bounds, direct editing, group scaling and exports accurate. No nonfunctional curve control is advertised.
- Fonts use Latin subsets; unsupported scripts/glyphs can fall back to system glyphs. Broad multilingual font coverage is not promised.
- The collection supplies regular and bold where available. Single-weight fonts synthesize bold when requested; italic is browser-synthesized. Arbitrary variable-weight sliders and dedicated italic face files are not included.
- Glow is a single native shadow, and the retro style uses a crisp offset shadow; multilayer extrusion is not added. The gradient is a two-color linear fill.
- Effect ink may extend outside its text box; the document canvas still clips exports at its edges. Overflow warnings remain available for text framing. Large blur values on many objects can be costly; no low-end-device benchmark was performed.
- Font previews can initially use fallback while loading; saved designs/export wait for their selected fonts. Failed loads are explicit and retryable. Offline use requires the local assets to be available/cached.

## Preview

Open `http://127.0.0.1:3000/editor/new`, add/select text and use the right-hand typography controls (Selection properties on mobile). Search a font, toggle formatting, expand Text effects or Text style presets, then save/export. Stage D has not started. The delivery message contains the final commit hash.
