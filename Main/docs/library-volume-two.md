# Creative library, volume two

Added 500 editable designs across 25 content briefs and 20 layout systems, including portrait, square, story, landscape and poster formats. These are reusable editorial layouts with themed copy, palettes and photographs; they are not 500 individually hand-drawn layouts. The full discovery library now contains 663 templates, plus the existing nine multi-page sets.

Added 200 original SVG stickers (400 total): labels, ribbons, botanical drawings, celestial motifs, arrows, doodles, frames and patterns. IDs of existing artwork are preserved.

Added 60 stock photographs (65 editor photos including the original five). Full files and 400px thumbnails are stored locally. The manifest `src/lib/creative/photo-library.json` records each fixed source URL and license. Stock photography is from Unsplash, under https://unsplash.com/license, downloaded on 2026-11-23. This is a design-tool collection; source photos must not be resold unmodified or used to replicate a stock-photo service. Asset selection makes a local copy inside the editable document. No stock API key or remote stock request is needed while editing or exporting. Search, category selection, favorites, recents and incremental browsing are available.

Rebuild downloaded assets with `node scripts/expand-photo-library.mjs` and template previews with `node scripts/build-volume-two.mjs` from Main. Both use the sharp dependency already shipped with Next.js. Source downloads require internet; preview rebuilding does not.

Account changes now produce a typed session transition, reload into the authenticated identity and retain separate caches. Guest tabs also detect authentication changes. Existing account caches can open while network sync continues; account requests and lock waits have bounded timeouts.

Validation: 144 Node tests; lint and production build. `/dev/library-validation` (development only) checks all 500 designs with real browser font metrics, decodes 10 PNG/JPEG exports, loads all 60 full-size images through the normal importer, and rasterizes all 200 new stickers without writing workspace records. All passed in Edge. Actual account workspace recovery and a saved account status were also observed.
