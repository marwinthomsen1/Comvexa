# Editor upgrade — assessment, stages and Stage A delivery

November 12, 2026. Baseline implementation `74c1478`; roadmap `e1beb24`. Dedicated branch `feat/editor-stage-a`. Scope: Stage A only. No Phase 7, deployment, Supabase changes, AI service, or schema migration.

## Assessment and design decisions

1. **Usability:** the prior horizontal category strip and long properties panel buried common settings among geometry, canvas and export controls. Desktop and mobile shared too much layout. Symbol-only actions and weak selection hierarchy increased discovery effort. Connected-field selection could leave users facing campaign dropdowns before common edits.
2. **Missing creative features:** multi-selection/groups, rich typography/fonts/effects, decorative graphics, photo adjustments and pages remain absent. A navigation redesign does not implement them. The [roadmap](product-roadmap.md) describes the broader architecture and estimates.
3. **Layout:** desktop uses a labeled icon rail, adjacent tool panel, quiet central canvas with contextual action bar and zoom, and a selection-specific inspector. Download is a separate inspector view. Mobile uses a horizontal bottom tool rail, a pinned Edit entry, large tool/property sheets with a backdrop, close/Escape and keyboard focus management. All rail tools have working panels; Effects, Animation and Brand Kit are omitted until implemented.
4. **Icons:** added pinned `lucide-react` 1.72.0, ISC licensed. `StudioIcon` imports a bounded set with 19 px/1.75-stroke defaults; important controls keep labels, compact controls have accessible names and titles. The dashboard navigation uses the same wrapper. Existing marketing icons remain unchanged. UI icons do not become a licensed insertable design-graphics library. [Official package](https://lucide.dev/guide/react/), license in `node_modules/lucide-react/LICENSE` and npm package.
5. **Architecture:** tool metadata and selection wording live in `studio-tools.js`; safe save-before-navigation lives in `studio-session.js`; selection, canvas sizing and download panels are separate React components. The v1 document, IndexedDB v2, pure editing commands, renderer/exporter, connected resolution and revision logic remain unchanged. No migration runs. New photo insertion uses existing original assets and existing image validation.
6. **Compatibility risks:** panel relocation can hide a formerly reachable action; focus/drawer resizing and async save/navigation can lose usability or edits. Browser checks cover the principal paths; automated navigation tests ensure failed saves keep users in editor and pending saves finish before navigation, including intentional empty overrides. Existing tests protect binding/geometry/export behavior. Legacy render limits and one-canvas documents remain.
7. **Costs:** the icon package adds no paid API or runtime service. Photos load from existing same-origin assets. Local editing remains browser-local; there is no new cloud spend. Later fonts/assets need licensing review; local image filters need memory profiling; background removal/AI require explicit budget approval. Pages/groups require schema/command/renderer work, not just more toolbar buttons.
8. **Implementation order:** complete and review Stage A before approving B–E. Their criteria below are proposals, not claims of completion.

## Stage plan and acceptance criteria

| Stage | Planned scope / dependencies | Required acceptance and automated regression coverage |
| --- | --- | --- |
| A — implemented | Rail/panels, icons, contextual actions, searchable layers with direct locks, dedicated download, original-photo insertion, mobile sheets | Existing docs/templates open; edits save/reopen; undo/redo; text/photo/shape tools; labels and active states; visible connection/override/restore; safe navigation; unchanged geometry and export output; mobile and both themes inspected. Existing regression suite plus navigation tests. |
| B — awaiting approval | Multi-selection/group model and transactions, alignment/distribution, clipboard/shortcuts, layer controls and snapping | Multi-object transforms and group/ungroup preserve world coordinates and bindings; one undo step per gesture; clipboard IDs unique; locked objects protected; save/reopen/export fixtures; mouse/keyboard/touch parity. Require group schema proposal before migration. |
| C — awaiting approval | Licensed font registry/search/presets, text effects, searchable original/licensed graphics, fills/gradients | Font loading/fallback explicit; multilingual shaping reviewed; source and export effect parity; old docs migrate safely; font/asset provenance; invalid imported effects rejected; search/insertion UI checks. |
| D — awaiting approval | Nondestructive brightness/contrast/saturation/blur/filter model, masks/frames/shadows and crop UX | Undo restores source/effects; shared photo replacement preserves local styles/overrides; decoded memory bounded; golden crop/filter PNG/JPG comparisons; touch crop tests. Background removal remains a separately evaluated opt-in feature. |
| E — awaiting approval | Versioned pages, add/duplicate/delete/reorder/rename, page backgrounds, batch supported exports, deterministic smart styles/variations | Backup-first v1→v2 migration with rollback and original bytes retained; stable page/element/field IDs; page deletion cannot orphan shared assets; page ordering survives export/import; connected snapshots across all pages; old clients reject unsupported schema without overwrite. No destructive migration without approval. |

Every stage requires lint, automated regressions, production build, relevant browser editing/save/reopen/undo/redo/mobile/theme checks and actual export verification. No stage may advertise planned controls as available.

## Stage A implemented

- Templates, Text, Elements, Photos, Uploads, Backgrounds, Layers and Resize have labeled, icon-based working panels. Existing template gallery and all 32 templates/packages remain accessible. Template browsing saves first.
- Text editing controls appear before collapsed advanced position/line-height settings. Shape borders and image crops remain available. Lock/duplicate/delete appear in the inspector and contextual toolbar. Type starts direct canvas text editing without a double click.
- Selection toolbar and Layers show Independent, Connected or Custom value. Connected properties expose override, restore, detach and shared-campaign editing; connecting/changing sources is a disclosure. Opening shared information saves pending local changes first; a save failure keeps the editor open.
- Layers can be searched by text/type, selected or locked directly. Top actions show design name, undo/redo, save status, preview, resize, download and theme. Canvas zoom/fit and existing selection handles/guides remain.
- Dedicated download panel retains PNG/JPG quality, editable connected project backup and import. No formats were added. Photos provides five original Comvexa sample assets already used in the template catalog; uploads remain local.
- Mobile sheets expose essential tool/property/download actions with 44 px controls and 16 px input text. Close/backdrop/Escape and focus trapping/return work. Bottom tool rail scrolls independently instead of causing page-wide overflow. Advanced categories intentionally do not appear as inactive feature promises.
- Homepage code, animations, campaign persistence, templates and underlying artwork rendering were not redesigned.

## Verification

- ESLint: passed with zero warnings.
- Automated tests: 42/42 passed (40 existing and two new save/navigation regression tests).
- Safari desktop: new blank design, add/edit text, save, duplicate and undo, insert original motorcycle photo, open existing generated connected design, select price via Layers, override/restore, inspect download and light/dark themes.
- Safari actual export regression: four motorcycle designs updated ₱950→₱850 with identical layout geometry, ₱799 override preserved, save/reopen and portable roundtrip passed. Eight actual PNG/JPG outputs matched the expected current-price pixels and differed from stale ₱950. Existing fixture `tests/browser/connected-acceptance-fixture.js` was temporarily mounted for QA and removed from routes afterward.
- Edge phone emulation: iPhone 16 Pro Max 440 × 956. Add text from bottom rail/sheet, edit to “Mobile studio,” dismiss, reload and reselect via Layers; saved value preserved. Shift-Tab cycles from sheet close to final control; Escape returns focus to the opening rail button. No page-wide horizontal overflow visible in inspected layout; tool rail scroll is intentional.
- Production build: passed. Production-server HTTP smoke on loopback port 3001: 17/17 passed, including disabled authentication/API behavior. `git diff --check` and report local-link checks passed. No production deployment occurred.

Known verification limits: no physical phone/tablet certification, no screen-reader session or full IME/virtual-keyboard coverage. Mobile canvas transform/crop gestures retain prior implementation and still need physical-device testing. Browser verification is focused, not exhaustive. The native multi-file picker gap from earlier phases is not resolved by this navigation stage. Existing font, geometry, asset, one-canvas and export limits remain; filters, grouping, pages, AI and Brand Kit are not implemented.

## Local preview and review

From `Main`, run `npm run dev` and open `http://127.0.0.1:3000/editor`. Choose an existing design or create one. Use Text to insert text, select it to inspect contextual controls, Layers to find/lock it, Photos for an original sample image, Resize for dimensions, and Download for raster/project output. Open a generated campaign design to review connected-value controls. At a viewport below 900 px, tools move to the bottom and editing opens in sheets. Keep the same browser and origin for existing local records.

Stage A awaits review. Do not automatically begin B–E, Phase 7 or production deployment.
