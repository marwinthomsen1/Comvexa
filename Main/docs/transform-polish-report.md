# Transform interaction polish

Baseline `3e65cf2`; branch `feat/transform-polish`. This is a UX/performance correction before the template-library upgrade. No document schema, production or Supabase changes.

## Changes and decisions

Replaced overlapping dashed member boxes and canvas connection badges with a single thin, oriented Transformer boundary. The contextual inspector and Layers retain connection/override status. Resize handles are compact white rounded squares; rotation uses a purple circular button with an original rotation glyph, white ring, subtle shadow and a connecting line. Visible sizes and invisible hit areas increase on coarse pointers/small screens. Extra stage margin and a more generous Fit inset keep handles reachable near page edges; artwork is still clipped to the page and exports do not include selection chrome.

Rotation has 15° stops with a 3° capture tolerance. The Snap toggle controls both translation and rotation; Shift temporarily reverses it, and the title explains this. Live feedback displays angle/free-or-snapped state, movement delta or dimensions. Images preserve proportions by default (Alt permits free image resizing); groups and canvas text corner resizing remain proportional. Text font size now scales with its frame during canvas resizing so the final render matches the live glyph scale.

Removed competing group-drag controllers: Konva's Transformer proxy drag and application drag code previously both moved selected nodes. Translation now uses one pointer session with cached nodes, source geometry and precomputed snap stops. Mouse/touch movement and marquee feedback are coalesced by requestAnimationFrame. Resizing/rotation use Konva directly; document/history updates occur only once at completion. Synchronous restore/reconcile prevents a visible reset frame. Escape, touch cancellation, multi-touch interruption, focus loss and document/selection replacement cancel transient movement. Changed pointer IDs are respected; release outside the page is handled at window capture level.

Transformer attachment is retained when membership does not change. A transient orientation tracker keeps a rotated multi-object box stable across movement/resize/commit and undo/redo; uniformly rotated groups recover their orientation on reopen. Mixed-angle new selections begin axis-aligned. No per-member visual boxes remain stale during a gesture. Artwork, Transformer and guide/marquee overlays use separate layers. The image decode effect keys on asset bytes rather than the reconstructed asset object, preventing re-decode after unrelated document edits. Autosave timers and cross-tab refresh defer while a gesture is active, then resume with the final document; revision checks remain intact. Completed commands preserve existing binding and override state.

## Files

Updated `design-canvas.js`, editor gesture/autosave coordination, editor CSS, selection help and cached snapping. New `src/lib/editor/transform-session.js`, `tests/transform-session.test.mjs`, and retained browser fixture `tests/browser/transform-interaction-fixture.js`. Existing template/campaign/render document contracts and export formats remain unchanged.

## Verification

59 automated tests pass, including seven new tests: 1,000 samples coalesce to one paint; final flush/cancel discard duplicate work; rotation stops/Shift/wraparound; oriented frame stability and undo; single history commit with font/style/binding preservation; cached snapping performs no document reads per frame; touch chrome targets; numeric and pointer-baked group geometry equivalence. Lint passed with no warnings. Production build passed. Production-server HTTP smoke passed 17/17 checks on loopback port 3001. Temporary QA routes are excluded from the build.

Safari native pointer verification in a React Profiler fixture: group move, 30° snapped rotation and proportional corner resize each produced **one React render and one document commit at completion**. Undo restored width 100 from 79.99, redo restored 79.99. Exact save/reopen passed. Snap off allowed continuous 27.12° rotation. The production editor also moved an existing text/photo/shape group successfully, and the oriented box stayed aligned after commit. No claim of a measured FPS or latency percentile is made.

The instrumentation fixture can be mounted temporarily at `/transform-qa` for repeatable manual pointer checks, then removed from routes. It records commits/render counts and creates only QA records when Save is explicitly clicked. Automated rendering helpers do not substitute for physical touchscreen testing. Mobile hit-area policy is tested, but physical phone/tablet rotation, full modifier/cancellation combinations and large-library frame-time profiling remain outstanding. The working native browser was sometimes changed by concurrent user activity, limiting further phone verification in this pass.

## Preview and limits

Run `npm run dev` from Main; visit `/editor`. Select a group, drag any editable member, use the circular handle for rotation and corner handles for proportional resize. Toggle Snap or hold Shift; use Fit for edge-adjacent controls. Undo/redo and save/reopen remain available. Existing exact numeric transforms are retained as an alternative.

Groups remain single-level. A mixed-angle selection may include necessary whitespace in its bounds. Extreme transforms remain subject to document/font/image limits and can be rejected as a whole with a visible error. Separate layers and working margin add bounded canvas memory; physical Safari stress profiling is still needed. No cloud backup, video, AI or Stage C implementation was introduced.
