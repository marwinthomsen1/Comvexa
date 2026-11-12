# Stage B — Professional editing tools

Implemented November 12, 2026. Baseline Stage A `2dc78da` retained; branch `feat/editor-stage-b`. No production, domain, Supabase or paid-service changes. Stage C has not started.

## Features delivered

- Shift-click and explicit Multi-select mode add/remove objects; layer checkboxes provide touch/keyboard alternatives. Select all selects visible unlocked content and expands group membership; Clear/Escape clears selection. Blank-canvas marquee selects fully enclosed objects. Individual outlines and a shared transformer show the selection.
- Group/ungroup, group movement, proportional corner resizing, rotation and exact numeric scale/rotation. Flat groups preserve members' world coordinates and connected bindings. Regrouping merges groups rather than nesting them. Group members remain adjacent layers. Each completed drag/transform/command produces one document/history update.
- Copy, cut, paste, duplicate and delete for selections/groups. A separate browser-local IndexedDB clipboard supports different designs and tabs on the same origin, with validated documents, remapped element/group/asset IDs and preserved crop/override/binding data. Clipboard is not the operating-system clipboard. Cut happens only after a successful clipboard transaction and refuses to remove artwork if the document changed during copying.
- Cross-design connected paste keeps the original campaign reference when that campaign exists locally. Missing campaigns or mixing two campaigns is rejected visibly; it does not silently detach or invent shared information. The existing one-campaign-per-design rule remains.
- Left/center/right/top/middle/bottom alignment, canvas horizontal/vertical centering, and equal horizontal/vertical gaps for three or more independent units. A group counts as one unit and keeps its internal arrangement. A single unit aligns to canvas bounds. Bounds account for rotation; ellipses use ellipse bounds. Strokes are not included in alignment bounds.
- Snapping to canvas edges/center and other visible object edges/centers, dynamic guides and an on/off toggle. Drag tolerance is eight screen pixels converted by zoom. Arrow keys retain precise unsnapped movement; Shift moves ten document pixels.
- Searchable Layers with selection checkboxes, group membership labels, visibility and locks. Selection tools include forward/backward ordering and batch lock/unlock/hide/show. A group containing a locked or hidden member is protected as a whole from geometry, deletion, alignment and ordering changes. Intentional lock/show controls can restore it.
- Shortcuts: Cmd/Ctrl A, C/X/V, D, G/Shift-G, Z/Shift-Z/Y, S, Delete/Backspace, Escape and arrows/Shift-arrows. Inputs, textareas, selects, contenteditable, IME composition and Alt combinations retain their normal behavior. Preview mode does not intercept editing shortcuts.
- Mobile selection sheets expose clipboard, grouping, alignment, ordering and protection actions without a modifier key. A blank inspector offers Paste copied selection after Cut. Compact toolbars scroll independently of the page.

## Architecture and compatibility

`src/lib/editor/selection.js` contains pure selection, group, geometry, alignment, distribution, snapping, layer and shortcut commands. `clipboard.js` owns validated selection envelopes and the local clipboard database. `selection-controls.js` is shared by the inspector and compact toolbar. React/Konva remains the rendering stack; no new package dependency was required.

**Document schema v2** adds optional element `groupId` and `hidden`. Validation accepts v1 and v2, rejects malformed groups, requires at least two adjacent members, and prevents group/element identifier collisions. New and existing ordinary documents remain v1 until grouping or visibility is used; there is no mass migration or schema rewrite on open. Old clients reject v2 rather than silently discarding its new semantics. All element IDs, geometry, campaign fields, images and explicit overrides remain document-owned. Group transforms bake into members' geometry/styles; no renderer object serialization is stored.

On the first saved v1→v2 edit, the same design-save transaction stores an original `legacyV1Backup` portable snapshot on the record. Later saves and campaign updates preserve it. The Download panel exposes **Download pre-upgrade backup** when that snapshot exists. Importing it restores a v1 canvas through the existing validated importer; its included campaign is isolated as usual. Normal project downloads continue to represent the current design, not a collection of historical backups. A failed upgrade save leaves the previous persisted record untouched. This local recovery snapshot is not a cloud backup and can be lost when browser storage is cleared.

The existing design IndexedDB database stays version 2 with its original stores. The local clipboard uses a separate `comvexa-clipboard-v1` database/store and never changes campaign ownership. Portable connected envelopes remain version 1 and can contain a validated v1 or v2 document. No SQL migration was added.

PNG/JPG rendering and SVG template previews omit hidden elements and ignore group membership metadata while retaining the transformed artwork. Decoded photos are normalized to pixel canvases before use in both Konva editor and exporter, fixing a first-use transformed-photo resampling difference found during exact export comparisons. Decode is awaited, and temporary pixel canvases are released on replacement/unmount and after exports to limit memory. Original photo data and nondestructive crops remain saved.

## Files changed

New: `src/lib/editor/selection.js`, `src/lib/editor/clipboard.js`, `src/features/editor/selection-controls.js`, `tests/selection.test.mjs`, `tests/browser/stage-b-acceptance-fixture.js`, this report.

Updated: editor/canvas/properties/CSS, StudioIcon, document validator, image loading/export, connected store recovery metadata, template preview visibility, and README. Existing homepage, template catalog/generator, historical reports, auth and database configuration remain intact.

## Validation

- Automated suite: **52/52 passed** before final build checks. Ten new tests cover selection/touch-equivalent toggles, marquee, flat grouping/ungrouping, transforms and history, protected groups, rotated alignment/distribution, zoom-aware snapping, clipboard persistence/assets/remapping/rejection, v1/v2 save/reopen, connected-field metadata, shortcuts/IME, portable grouped projects and original recovery snapshots. All earlier tests remain.
- Safari desktop: create text and shape, Select all, group, inspect membership, duplicate mixed text/photo/shape group, exact scale/rotation, selection panels, and save/reopen. Existing generated connected artwork remains compatible through automated and browser regressions.
- Safari and Edge: actual grouped text/shape/cropped-photo PNG and JPG outputs exactly match equivalent ungrouped artwork; hidden content is absent; an independently expected transformed red-shape pixel is present. Grouped documents save/reopen identically and copied groups retain photo assets. An initial first-use photo pixel mismatch was investigated and fixed by shared pixel-source normalization; final exact comparisons passed in both browsers and repeated in Edge without relaxing tolerances.
- Safari connected acceptance: four motorcycle designs update ₱950→₱850 with unchanged layouts; ₱799 override retained; reopen/portable roundtrip and eight actual PNG/JPG current-price pixel comparisons pass using the new renderer.
- Edge iPhone 16 Pro Max emulation (440×956): Select all, multi-object editing sheet, duplicate, hide/show protection, cut (7→4 elements), paste (4→7), ungroup/regroup and alignment controls exercised. Both v2 artwork and original photo appear correctly. These checks use mouse input into browser touch emulation, not a physical touchscreen.
- Final ESLint passed with zero warnings; all 52 tests passed; production build passed; production-server HTTP smoke on loopback port 3001 passed 17/17 cases; `git diff --check` passed. Temporary QA routes are removed from application output; fixtures remain under `tests/browser` for repeatable local verification.

## Limitations and follow-up testing

Groups are one-level membership, not nested scene graphs. Multi-object resizing is proportional; skew/nonuniform deformation of groups is unsupported. Dimensions/font/style resource limits remain enforced; an invalid whole-group transform is rejected visibly rather than partly applied. Uniformly scaling text changes its font size; resizing a single text frame retains prior frame-resize semantics.

The clipboard works only inside Comvexa on the same browser origin, including tabs. It does not import arbitrary system clipboard HTML/SVG/images, and copying connected content to a design using another campaign is intentionally blocked. Copying locked artwork is allowed; pasted copies are unlocked. Hidden artwork remains hidden until explicitly shown. No real-time cloud synchronization or backup is available.

Pure automated commands cover dragging/snapping/marquee/transform calculations, but the full native pointer/gesture matrix was not certified. Native drag automation did not provide a conclusive result for every handle/marquee path; physical iOS/Android/tablet dragging, pinch/pan, off-canvas releases, stylus and keyboard/screen-reader combinations need broader QA. Exact numeric transforms and touch-accessible commands provide tested alternatives. The new decoded-pixel canvases consume memory proportional to image pixels; maximum-image-library stress on physical Safari remains outstanding despite cleanup and existing budgets. Native multi-file picker testing from prior phases remains incomplete.

## Preview

Keep the local server on port 3000 and open `/editor`. Create a design, add text and shapes, use Select all or Shift-click, then Group. Drag the group or use **Edit selection → Exact group transform**; try alignment/distribution after creating at least three units. Use Layers checkboxes on touch devices, hide/show and lock controls. Copy or cut, open another design in the same origin, and Paste; a connected design requires the same source campaign. Download PNG/JPG or a portable project. The pre-upgrade backup appears only after a saved v1 design first upgrades.

To repeat browser export checks, temporarily copy `tests/browser/stage-b-acceptance-fixture.js` to `src/app/stage-b-qa/page.js`, run locally, and click **Run Stage B acceptance**. It creates QA-prefixed records with UUIDs. Remove that temporary route afterward. The existing connected acceptance fixture can be mounted in the same way. Do not mount QA routes on a public deployment.

## Stage C recommendation

Review Stage B and finish physical-device gesture/memory QA before extending creative styles. Then prioritize a licensed curated font registry, clear font loading/fallback, text presets/effects with shared render/export semantics, and a searchable original/licensed graphics catalog. Extend v2 with explicitly validated style capabilities and golden export fixtures; retain group, visibility, backup and campaign/override regressions. Do not implement AI services, nested groups or Stage C automatically.
