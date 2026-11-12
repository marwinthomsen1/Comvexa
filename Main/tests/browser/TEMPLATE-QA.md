# Reproducing the template acceptance review

The browser fixtures are deliberately outside `src/app`. No filesystem-writing QA endpoint is included in the application or production build.

On a **local disposable checkout and browser profile**, temporarily copy:

- `template-library-acceptance-fixture.js` → `src/app/template-library-qa/page.js`
- `template-library-sink-fixture.js` → `src/app/api/template-library-qa/route.js`
- `template-gallery-measurement-fixture.js` → `src/app/template-gallery-qa/page.js`

Create parent directories first. Start `npm run dev`, visit `/template-library-qa` in a browser and click **Verify all 100 templates**. The page uses real browser font measurement, the actual IndexedDB store, document editing/history and the actual Konva PNG/JPG exporter. It checks full export dimensions, persists per-template results, writes 200 exports under ignored `docs/template-review/exports/`, and regenerates actual 480px WebP thumbnails. The run creates test designs in this browser; use a disposable profile to keep them separate from personal projects. It does not operate a production service.

**Audit original 32** renders the earlier eight families × four formats for visual comparison. It does not create fake connected campaigns or claim these standalone fixtures have functioning campaign connections. Their compatibility is covered by existing connected-store tests.

After changing recipe metadata, run `node scripts/build-template-metadata.mjs`; the automated synchronization test catches stale fields.

Run `node scripts/build-template-review.mjs` to rebuild the 10 public contact sheets and summary after the 100-template run. `node scripts/build-legacy-review.mjs` builds the four legacy comparison sheets after the old-template run. These scripts use the Sharp installation shipped with Next in this workspace.

Visit `/template-gallery-qa` for a real same-origin gallery iframe, a phone-width switch and a read-only measurement button. Desktop and phone widths, horizontal overflow, mounted cards, thumbnail network resources and full-resolution photo requests are measured from the iframe. Inspect search/category/format/style/reset/preview/start manually. The recorded filter measurement is a small metadata microbenchmark, not full React latency.

Remove the three temporary application routes after verification and before building production. Review all contact sheets visually. The acceptance fixture exercises every native document and exporter; it does not simulate clicking every layer property in all 100 editor routes. Test representative editor workflows separately.
