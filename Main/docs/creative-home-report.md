# Creative Home and design entry

Branch: `feat/creative-home`. Baseline: `25873c3`. No production, domain, Supabase, dependency, or editor-tool changes.

## Changes

Home now starts with “What will you create today?” and three clear actions: blank design, templates, and a design package. A shared search filters saved designs and templates. Recent designs open directly, recommendations cover fashion, food, invitations and travel, and campaigns appear only when records exist.

Primary navigation is Home, My Designs, Templates, Design Packages and Campaigns. Projects and profile settings remain available from Account. Mobile navigation shows all five destinations. Connected campaign pages highlight Campaigns. The editor's save-and-return action goes to Home.

`/dashboard/designs` is the single saved-design library. `/editor` redirects there; `/editor/new` opens its format picker. Creating a blank design saves the chosen canvas and opens the editor without a project requirement. Template artwork now starts an editable design directly.

Design cards have real rendered previews, names, dimensions, edited dates, direct editing links and compact rename/duplicate/delete menus. Delete is reversible through Recently deleted; no document or campaign record is permanently deleted. Duplicates preserve assets and connected content through the existing connected save path.

## Thumbnails and compatibility

The existing Konva export renderer accepts an optional maximum dimension. Thumbnails render at a maximum of 480 pixels, using the same typography, graphics, photo adjustments and crop behavior as export. Visible/nearby cards load through IntersectionObserver and a serialized render queue. IndexedDB caches one blob per design with its revision; changing the revision regenerates its preview when displayed. Cards beyond the initial 24 load on demand, and object URLs are revoked on unmount. Failed previews show a named fallback.

IndexedDB version 3 adds only a `thumbnails` object store. Existing design/package stores and document schemas remain intact. Thumbnail failures cannot block document saving. Browser storage remains local, as indicated in the header. Old tabs may need reloading if they block a database upgrade.

## Before and after

| Before | After |
| --- | --- |
| Project-first dashboard | Create, choose a format, start editing |
| Separate text-only editor library | One My Designs view with real previews |
| Template preview before editing | Click artwork to open an editable copy |
| Projects/settings competing in main navigation | Five primary destinations; organization in Account |
| No library management menu | Rename, duplicate, reversible delete/restore |

## Browser verification

Safari desktop: blank design → format picker → editor; recommended template → editor; editor → Home; recent thumbnail → editor. Renamed a newly created QA design, duplicated it, deleted the duplicate and restored it. Generated and saved a four-format package; its new campaign appeared on Home and opened the connected workspace. Added text to a generated design, returned Home and visually confirmed the updated text in its regenerated thumbnail. Existing saved photo designs and earlier connected campaigns remained accessible. Light/dark appearances inspected.

390 × 844 Safari iframe: five-item navigation and creation cards fit the viewport; format picker opened and created an editor canvas. This is viewport testing, not a physical phone test. Fixture source is retained in `tests/browser/creative-home-mobile-fixture.js`, outside application routes.

## Checks

- Lint: passed, zero warnings.
- Automated tests: 93/93 passed. New tests cover rename validation, duplicate content, reversible deletion/restoration, revision-keyed preview cache, and v2 → v3 preservation of saved designs/campaigns.
- Production build: passed.
- Production localhost HTTP checks: 20/20 passed, including new library route, both redirects and fail-closed auth APIs.

## Files changed

Routes: `src/app/dashboard/page.js`, new `src/app/dashboard/designs/page.js`, `src/app/editor/page.js`, new `src/app/editor/new/page.js`.

Workspace: new `creative-home.js`, `creative-home.css`, `design-thumbnail.js`; updated `workspace-shell.js`, `workspace-view.js`.

Templates/editor entry: `template-library.js`, `generated-campaigns.js`, `package-builder.js`, `editor.js` (return navigation only).

Storage/rendering: `database.js`, `store.js`, `export.js`, new `library.js`.

Tests: new `design-library.test.mjs`, mobile browser fixture, updated `http-smoke.mjs`. Screenshots in `docs/creative-home/`.

## Screenshots and preview

- [Home, light](creative-home/dashboard.png)
- [Home, dark](creative-home/dashboard-dark.png)
- [My Designs with rendered thumbnails](creative-home/my-designs.png)
- [Mobile Home](creative-home/mobile-home.png)

Run `npm run dev` from Main; open http://127.0.0.1:3000/dashboard or http://127.0.0.1:3000/dashboard/designs. Existing dev server was left running.

## Limitations

Physical iOS/Android and other browsers were not tested. The first preview of an older uncached design still needs asset decoding and font loading; subsequent visits use the cache. Large libraries still read existing IndexedDB records for metadata, although card rendering and thumbnail work are bounded. Deleted designs remain in storage and can remain accessible through existing campaign links to preserve connected records. No permanent-delete operation was added. The old project/campaign organization tools remain available; this task does not migrate or remove them. PNG/JPG rendering regression coverage passed; no new manual full-resolution export comparison was performed in this navigation-focused pass.
