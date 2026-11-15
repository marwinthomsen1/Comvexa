# Video & Audio Studio — Upgrade 1

Branch: `feat/video-audio-studio`, based on `3af9041`.

Implemented inside the existing editor:

- Video formats: landscape 1920×1080, vertical 1080×1920, square 1080×1080, HD 1280×720; existing resize controls support custom canvases. Duration: 0.5–60 seconds.
- Compact/scrollable navigation with Uploads, Video and Audio. No unavailable AI/Apps destinations or payment gates.
- Browser-decodable video/audio uploads; original blobs are saved in a separate IndexedDB media store before document references are added. Images reuse existing upload/editing, with image copies available from Uploads. Video source previews and cached thumbnails; source replacement and library removal.
- Timeline with ruler/playhead, seeking, scrolling, zoom, selection, draggable trim edges, video reordering, splitting, deletion, audio positioning and timed overlay tracks. Keyboard S/Delete operate when the timeline itself has focus. Edits use the existing undo/redo history.
- Actual composition preview using one Web Audio clock: source footage, existing graphics/text/stickers/drawing, timed overlays, existing element animations, page entrances and mixed audio. Graphics remain editable in the normal canvas; Playback preview shows the composition.
- Original video audio plus up to eight uploaded music/voice clips: trims, starts, volume, mute and fades. One audio path per source, with a mix compressor. Source preview playback is paused when timeline playback begins.
- Cut and fade-to/from-background clip transitions. Existing fade/slide/zoom page entrances render in video output.
- Real-time native Canvas Capture / MediaRecorder exports, capped to 720p or 1080p without upscaling the document. WebM VP8/Opus is validated. MP4 H.264/AAC is offered only when native capability detection accepts that exact MIME; every output is container-checked and played back before download. No extension renaming or external rendering API.
- Download → Video also exports animated static artwork on its current page. Normal PNG/JPG/ZIP/raster-PDF artwork exports remain available. Static downloads render artwork layers; they do not include video source footage/audio.
- Six three-scene motion templates in the existing gallery, with covers generated from their actual documents and live composition previews. Existing 157 templates remain intact.
- Project/media ZIP backup and restore includes original source blobs. Import uses new media IDs and a new design ID. Browser-only JSON recovery files cannot transport original media across browsers.
- Standard/future-premium feature metadata only; no memberships, billing, client entitlement enforcement or remote AI calls.

## Limits / deferred

Video editing is single-page; multi-page designs can export the current page as animation. Export is real-time and requires a visible tab and adequate browser resources. Codec support varies by browser/device; 1080p and MP4 have not received cross-browser validation. No GIF, speed control, crossfade between overlapping video sources, per-clip slide/zoom, automatic subtitles, live voice recording, stock music, photo slideshow template, paid tools or automatic unused-media garbage collection. Removed media blobs are retained for undo, so removing a library item does not immediately free storage.

Limits: 50 MB per video/audio source, 150 MB media per project, 20 sources, 30 video clips, eight audio clips, 60 seconds, 200 MB output/backup. Missing sources stop export with an error. Local media requires the same browser/origin unless restored from a media ZIP. No storage migration, production/Supabase change, deployment or Phase 6 work.

## Validation

Four focused timeline/schema/history/audio/template tests passed. Lint and the production build passed; the build was repeated after correcting shared blend-mode compositing. No extensive browser/device suite was run.

Focused real browser test in Microsoft Edge produced `video-validation/validated-720p.webm`: genuine VP8/Opus WebM, 1280×720, 2.5 seconds, 470,063 bytes. It decoded, played past 0.21 seconds, and decoded distinct frames across trimmed/reordered footage. The encoded title changed from zero to 1,029 white title pixels at its scheduled entrance. A static Multiply pixel check passed after the compositor correction. Both 440 Hz original video audio and 880 Hz added music were measured in the decoded audio. Media ZIP restoration passed. A full page reload restored two clips, one audio track, the animated title and both source blobs. The integrated editor opened and played the saved project. Exact results: `video-validation/result.json`.

The repeatable focused fixture is at `/dev/video-validation` in development only; production returns not found. It creates synthetic media and its own test design.

## Local preview

Run `npm run dev` from `Main`, open `http://localhost:3000/dashboard`, and choose a video canvas or Templates → Video & Motion. In the editor: Uploads → choose a source → Add → trim/split → add text/music → Playback preview → Download → Video. Download the project/media ZIP before clearing browser storage.
