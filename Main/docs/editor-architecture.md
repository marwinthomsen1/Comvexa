# Phase 3 editor decision — 12 November 2026

Before implementation, a disposable /editor-prototype compared Konva and Fabric in the browser with text, selection/transform controls, cropped local images, a small app-owned position/text roundtrip and PNG/JPG data URLs. Both loaded and exported. This was a feasibility spike, not a complete persistence or device certification. Fabric's Textbox edits inline out of the box; Konva uses a native textarea overlay. Fabric also needs an adapter to avoid coupling our data to its object serialization.

Selected: React Konva. React renders our application document into Konva nodes; Transformer provides handles/rotation. Text input stays in the DOM for IME/accessibility. Native properties and layer controls provide alternatives to gestures. Touch behavior must be checked in the actual editor. No commercial editor SDK.

The versioned application schema owns geometry, type, style, text/image asset content, optional shared field binding and explicit local override. Renderer state, selection, zoom, guides and handles never enter saved data. Pure commands validate updates; immutable snapshots support bounded undo/redo. Assets use data URLs restricted to PNG/JPEG/WebP inside a validated portable document. IndexedDB stores documents asynchronously under project IDs, with optimistic revision checks to avoid silent multi-tab overwrites. Cloud authentication remains unavailable. Local save is not a backup; JSON download/import provides portability.

Exports use a separate offscreen Konva stage at document dimensions, with only artwork/background; fonts and images must load first. No remote image URLs, HTML/SVG uploads, controls or guides in exports. Canvas and image dimensions, element count, document bytes and history are bounded. Editor imports are client-only and lazy. PDF, rich text, grouping, collaboration and full connected-content UI are deferred.

Sources: https://konvajs.org/docs/react/Transformer.html ; https://konvajs.org/docs/sandbox/Editable_Text.html ; https://www.fabricjs.com/docs/cropping-images/ ; https://www.fabricjs.com/docs/core-concepts/ .
