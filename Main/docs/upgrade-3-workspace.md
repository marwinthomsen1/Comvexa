# Upgrade 3 — Professional editor workspace

Implemented on `feat/upgrade-3-workspace` from `93a2b70`.

## Delivered

- Canvas-focused layout with collapsible, resizable side panels and Focus Mode. Panels stay mounted to preserve tool drafts.
- Compact navigation with pinned tools, recent tools, an All tools directory, search, and active-tool indicators.
- Cmd/Ctrl+K command search routes to working tools and actions, including Brand Kits, Bulk Create, canvas resize, image tools, animation and export. Context-dependent actions explain their selection requirement.
- Selection-specific text, image, shape and video controls open the existing editing controls. Advanced properties remain available on request.
- Local favorites and recent assets for templates, stickers, frames, elements, text and style presets. Gallery search, filters, pagination and lazy image loading improve browsing.
- Fit, actual size, pointer-centered modifier-wheel zoom, Hand mode and Space-drag canvas panning. Navigation does not alter artwork or undo history.
- Resizable/collapsible video timeline with remembered zoom and height.
- Compact mobile navigation, editing sheets, accessible separators, focus indicators and reduced-motion styles.
- Expensive editor libraries load on demand.

## Shortcuts and persistence

Cmd/Ctrl+K opens tool search; Cmd/Ctrl +/- zooms; Shift+1 fits; Shift+2 shows actual size; F toggles Focus Mode; H toggles Hand; Space-drag pans; G toggles guides. Existing editing, save, clipboard, grouping and undo shortcuts remain. Text inputs and editable text are excluded from workspace shortcuts.

Panel visibility/sizes, navigation preferences, timeline settings and favorites use separate local UI preferences. Zoom, pan and Focus Mode are session-only. Existing project schemas, IndexedDB persistence, export engines and stored user assets are preserved.

## Focused validation

- `node --test tests/workspace-ui.test.mjs`: 6 passed (preferences, pins/recents, command routing, keyboard guards, zoom anchoring, asset filters).
- Native browser checks: command search opened Brand Kit directly; collapsed panels and pins survived reload; manual 100% zoom survived panel collapse; Focus Mode and Hand panning worked without artwork mutation.
- Development-only workspace fixture: favorite/recent storage round trip, saved project reopen and actual PNG decode at 900 × 600 passed.
- Existing real video fixture: WebM VP8/Opus, 1280 × 720, 2.5 seconds, decoded playback, distinct frames, animated title, original audio plus added music, trimmed clips and backup restoration passed.
- `npm run lint`: passed, zero warnings.
- `npm run build`: passed.
- `git diff --check`: passed.

## Limits

No cloud synchronization or accounts for preferences. Video clip animation was not added: existing element animation remains available; clip controls expose working trim/split/volume/replace actions. Background removal search accurately identifies the existing solid-background remover. Mobile/tablet CSS was improved without extensive device testing, as requested. No production deployment, Supabase changes or Phase 6 work.

Run `npm run dev` in `Main`, then open http://localhost:3000. Development fixtures live at `/dev/workspace-validation` and `/dev/video-validation`; production renders not-found for these routes.
