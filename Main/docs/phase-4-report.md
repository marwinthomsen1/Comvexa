# Comvexa — Phase 4 templates and design packages

## Delivered

A functional template library at `/dashboard/templates` and guided package builder at `/dashboard/packages`. Homepage design and animation remain unchanged. The existing React Konva editor is reused.

The library contains eight curated families, each in square (1080 × 1080), portrait (1080 × 1350), story (1080 × 1920), and landscape (1200 × 630) formats — 32 native editable compositions:

| Category | Family | Visual direction |
| --- | --- | --- |
| Fashion | The editorial edit | Coral, cobalt, large editorial typography, cropped full-height imagery |
| Food and restaurants | Fresh off the grill | Warm restaurant imagery, cream typography and a contrasting offer panel |
| Beauty and skincare | Daily rituals | Ivory/sage, quiet serif typography, asymmetric product imagery |
| Electronics | Next frequency | Deep blue, electric accent panels and focused product imagery |
| Cars and motorcycles | Open road | Charcoal/lime, panoramic vehicle photography and technical type |
| Travel and tourism | The island journal | Destination imagery and layered serif editorial panels |
| Birthday invitations | A little celebration | Pastel circles, centered invitation text and a photo medallion |
| Events and concerts | After hours | Contrasting geometric shapes, large type and festival details |

Search, category and ratio filters, a keyboard-accessible native preview dialog, Customize/Start from template and Start from blank are implemented. Previews load near the viewport and share the same document-generation code used for saved designs. The original Phase 2 generated photography is reused; no new stock images, paid AI calls, dependencies or external image services were added. The motors example currently depicts a motorcycle; cars can use uploaded photography. Birthday/event examples reuse existing original imagery until replaced by the user's own photos.

## Workflow

1. Enter product/event name, description, optional price/offer, contact details and website/social text.
2. Choose a style, change background/text/accent colors, optionally upload up to four photos, and choose one design or the four-format package.
3. Generate and review editable previews. Uploaded photos are assigned across formats in upload order; center-crop fitting adapts each source to its frame. A single design uses the first photograph.
4. Save the campaign and its designs atomically. Open any result in the existing editor, edit elements, autosave, reopen and export PNG/JPG.

Uploads retain Phase 3 signature/decode validation, file/dimension limits and local optimization. Permanent assets are embedded under stable IDs in IndexedDB, never temporary blob URLs. Multiple-photo packages retain a stable photo-ID list on the campaign. A failed upload does not silently replace the previously selected photo. Example images are identified as examples.

Content is fitted by word wrapping and progressive font reduction using actual browser font measurements. Important optional fields are omitted only when empty. Oversized content produces explicit warnings and disables saving until it fits; no ellipsis is used to silently discard content. The editor also warns when subsequent text edits overflow their frame. Crops remain editable. Preferred colors are not automatically recolored for contrast, so users should inspect their custom palette.

## Editor and connected-content architecture

Application schema remains version 1. Phase 3 documents remain structurally compatible. Generated documents add optional validated `provenance: {templateId, campaignId, ratio}`. Text/image/shape geometry stays independent of content. Text and image elements carry `{campaignId, fieldId}` binding references and `localOverride: false`. Editing bound text or replacing a bound image sets `localOverride: true`; moving/styling an element preserves its content binding. Multiple photos use `photos.0`, `photos.1`, etc. references into the campaign's stable photo-ID list.

Shared campaign fields are stored separately from design layout in the `packages` object store. No propagation or full shared-content editing UI is implemented. Changing a saved design currently affects only that design.

The IndexedDB database retains its existing name, upgrades from version 1 to 2, preserves `designs`, and adds `packages`. New package transactions insert the campaign and all one/four design records together. Quota failure or duplicate identifiers abort the entire transaction. Existing autosave revision checks remain intact. The template library creates new designs instead of replacing an open canvas, so it cannot destroy the open design's recovery history. Editor navigation to the library saves the current design first.

Dashboard navigation includes Browse Templates, Create Design Package, My Designs and My Campaigns. Generated designs appear in the existing design library; generated campaigns appear in My Campaigns alongside the unchanged planning-campaign workflow. Planning drafts remain in localStorage; artwork/packages remain in IndexedDB. No cross-storage fake transaction is attempted.

## Verification

- Automated coverage includes catalog loading/filtering, all templates/ratios, independent editable compositions, campaign field mapping, long/missing text, source cropping and image replacement, multiple-photo references, save/reopen, duplicate protection, whole-package quota rollback, Phase 3 document compatibility, real v1→v2 IndexedDB upgrade, and nonoverlapping important text frames.
- Existing authentication, workspace, history, export-dimension, image-safety, PostgreSQL RLS and motion tests are retained.
- Native Edge desktop: search narrowed the catalog to four travel templates; preview dialog and Start from template opened customization. A QA-prefixed travel package generated all four formats, saved successfully, and its square opened in the existing editor with eight editable elements. Text editing and undo/redo remained available.
- Safari: all 32 templates passed fitting with actual browser font metrics; 64 PNG/JPG exports were encoded, decoded and checked at their exact expected dimensions. This checks the actual renderer, not only export-option objects. Fixture retained at `tests/browser/template-exports-fixture.js`; temporary QA route removed.
- Safari package information/style steps and native upload picker were opened. Full native multi-file selection could not be completed before the computer-control service failed. Picker accept filters include both MIME types and filename extensions. Browser image decoding/optimization is exercised by the export fixture; multi-photo mapping/persistence is automated-tested.
- Phase 4 phone emulation and final browser visual review could not be completed after the control service failure. Responsive CSS covers narrow filters, two-column galleries, stacked forms, reduced-motion backdrop and mobile package previews, but this is not a substitute for physical-device testing.

Final command results are recorded below after validation.

## Files created or changed

New: `src/lib/templates/{catalog,fitting,generate,assets}.js`; `src/features/templates/{template-library,package-builder,document-preview,generated-campaigns}.js`, `templates.css`; `src/app/dashboard/packages/page.js`; `tests/templates.test.mjs`, `tests/browser/template-exports-fixture.js`; this report.

Changed: editor document validation and local store; editor overflow warning, template navigation and upload filter; design library links/metadata; dashboard template gallery/navigation/overview/campaign listing; HTTP smoke tests; README.

No database server migration, Supabase configuration, privileged credentials, production deployment or domain change. No historical documentation removed.

## Limits and next phase

The library starts with eight families, not an unlimited catalog. Layouts are curated rules, not AI-generated designs. Each design has one photo frame; up to four uploaded photos distribute across the four formats. Templates are copied into independent documents; updates to template definitions do not rewrite saved artwork. No campaign-level regeneration/propagation, template favorites, bulk image export, cloud synchronization, multi-selection or new font system is included.

Draft form inputs and previews are not durable until Save succeeds. Refresh warnings protect unsaved generated previews, but browser shutdown can still lose unsaved work. Saved files are browser-local and can be cleared/evicted. Download editable files for backup. Downloading several project files may trigger a browser multiple-download prompt. Print limitations and Phase 3 editor constraints still apply. Custom text/colors/photos require human review. Phone, physical-device, assistive-technology and full cross-browser regression testing remain recommended.

Phase 5 should add explicit campaign field editing/propagation with override resolution, transactional revision/conflict handling, shared asset lifecycle and previews of affected designs. Validate those behaviors before introducing cloud persistence. Phase 5 has not begun.

## Local preview

From Main run `npm run dev`, then open http://127.0.0.1:3000/dashboard/templates or `/dashboard/packages`. Generate, save and open a design; verify it also appears at `/editor` and its campaign at `/dashboard/campaigns`. Temporary verification servers are stopped at handoff.

## Final command results

After the verification environment restarted, checks were rerun against the final saved source:

- `npm run lint`: passed, no warnings/errors.
- `npm test`: all 30 tests passed (19 existing, 11 template/package tests).
- `npm run build`: passed; 14 static pages generated and existing dynamic routes retained. Temporary browser QA route is absent from the final build.
- `npm run test:http`: all 16 checks passed against the loopback production build (12 HTML routes, 3 unavailable-cloud API checks, unknown route 404).
- `git diff --check`: passed.

Git protection: recovery tag `recovery/pre-templates-phase-4-fa474c2`; development branch `feat/templates-phase-4`. Earlier recovery tags are unchanged.
