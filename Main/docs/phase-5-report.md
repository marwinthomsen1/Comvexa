# Phase 5 — Connected Designs

Implemented November 12, 2026. Local browser workspace only. No production deployment, domain changes, Supabase connections, or Phase 6 implementation.

## Functionality and campaign management

Generated campaigns now open a shared-information workspace from `/dashboard/campaigns`. Users can edit reusable name, description, price, currency, dates, phone, address, website, social, legacy contact/link fields, and custom fields. Custom IDs survive label renames. Fields can be added, renamed, or removed; removing a referenced field requires explicit detachment and preserves its visible artwork.

Multiple previews resolve together while typing, with a brief reduced-motion-aware fade. An explicit **Save shared changes** commits the campaign and every associated design in one IndexedDB transaction. This prevents typing drafts from silently replacing saved artwork. Individual editor autosave remains active. Associated designs show connected/overridden counts, overflow warnings, individual editor links, and additional-ratio generation from current campaign information. Draft backup download/import supports recovery.

## Binding, override and editor architecture

`src/lib/connected/model.js` owns normalization, resolution, safe removal, cropping and portable envelopes. A binding retains stable `campaignId`/`fieldId` and optional plain/uppercase transform; `localOverride` explicitly distinguishes even an empty override. Text geometry and typography stay independent. Editor properties offer connect, override, restore and remove connection. Layer names and non-exported canvas badges identify linked and overridden elements. Undo/redo resolves against current shared content instead of replaying stale shared values.

`src/lib/connected/store.js` performs consistent read snapshots, atomic campaign/design writes and optimistic revision checks. Conflicting campaign or design edits fail visibly, retain the draft, and offer reload/recovery. Cross-tab notifications plus a three-second fallback refresh synchronize clean local workspaces; dirty editors are protected. Quota/interrupted transactions roll back all writes.

## Shared images

Campaign images are supported. Replacing a source updates connected image appearances while preserving frames, position, rotation and styling. Same-aspect sources retain crops; different-aspect sources adapt crop center/zoom within the new image bounds without stretching the frame. Intentional local image overrides are preserved. Original campaign assets are stored separately so overriding every appearance does not destroy the shared source. Image MIME/signature, size and pixel limits remain enforced.

## Storage and compatibility

No SQL migration or remote configuration was added. IndexedDB remains `comvexa-designs-v1`, version 2, with existing `designs` and `packages` stores. Campaign records gain `connectedVersion: 1`, revision, canonical `sharedFields`, shared assets, and design membership. Older Phase 4 records normalize lazily; original Phase 3 independent documents remain valid. Document schema remains version 1 with optional validated `binding.transform`.

Portable editor projects use a validated `comvexa-connected-project` version 1 envelope containing the design and consistent campaign snapshot. Import remaps campaign IDs to isolated local records, avoiding accidental overwrite of the originating campaign. Legacy independent JSON remains supported. Missing/corrupt references are visible; exporting unresolved connected artwork is blocked, with a separate cached recovery download available. Imported content cannot introduce scripts or SVG assets.

## Validation results

- `npm run lint`: passed, zero warnings.
- `npm test`: 40/40 passed, including all earlier regression tests and ten connected-design tests.
- Tests cover four-design price propagation, custom IDs/renaming, empty overrides, restore/detach, referenced-field deletion, images/crops, rapid conflicting writes, stale autosave/export, interrupted quota rollback, undo/redo, persistence, isolated portable roundtrips, malicious imports and backward compatibility.
- Browser acceptance passed in Safari and Microsoft Edge: one motorcycle campaign, four aspect ratios, ₱950→₱850, unchanged layout geometry, ₱799 override preserved, reopen correct, portable roundtrip correct. Each browser rendered and checked eight real PNG/JPG outputs. Price-region pixels matched expected current-price artwork and differed from stale ₱950; canvas dimensions were checked. Sixteen exports checked total.
- Actual campaign edit/save passed in desktop Safari and Edge iPhone 16 Pro Max emulation (440 × 956). Mobile shared information/preview tabs and reachable save controls were inspected. Native macOS file picker selected the original local motorcycle WebP; the shared photo update saved successfully. This revisits the previously incomplete picker test. Full multi-file picker and physical smartphone/tablet testing remain unverified.
- Browser fixture retained at `tests/browser/connected-acceptance-fixture.js`; it is intentionally excluded from application routes. To repeat locally, temporarily copy it to `src/app/connected-qa/page.js`, run the local server and click **Run motorcycle acceptance test**, then remove the temporary route. It creates QA-prefixed records without modifying existing campaigns.
- `npm run build`: passed. `npm run test:http` against the production server: 17/17 checks passed, including fail-closed authentication and connected workspace routing. `git diff --check`: passed.

## Files changed

New connected model/store modules, extracted editor database opener, campaign workspace/connection panel/CSS, `/dashboard/connected/[id]` route, connected automated tests, browser acceptance fixture and this report. Updated editor, properties, canvas indicators, document validation/store, generated-campaign links, package-builder copy, HTTP smoke and README. Historical reports are retained.

## Preview

From `Main`, run `npm run dev`, then visit `http://127.0.0.1:3000/dashboard/campaigns`. Existing generated campaigns have **Manage connected information** links. Or generate a package at `/dashboard/packages`, open its campaign, edit Price and inspect previews, save, then open an individual design. Override a selected linked price in editor properties and repeat the shared update. Download PNG/JPG or an editable project from the editor. Keep the same browser and origin to retain local records.

## Limits and Phase 6 recommendations

One design connects to one campaign. Currency is a separate text field; updating it does not automatically format a price string. Campaign saves are explicit; editor saves are automatic. Browser storage is neither cloud sync nor backup, and browser clearing can remove it. Download portable project files for backups. Local snapshots currently scan stores; large libraries should use indexed membership queries and asset deduplication. Shared-image crop adaptation is geometric rather than subject-aware. Text overflow is warned rather than silently changing existing typography. Physical device coverage, full multi-file picker coverage and broader touch editor QA remain follow-up verification work.

For Phase 6, prioritize indexed library/asset management, batch portable backups, physical-device testing and approved development-only cloud persistence with access-control tests. These are recommendations only; Phase 6 has not begun.

Git protection: baseline `1fb34ff` retained; recovery tag `recovery/pre-connected-phase-5-1fb34ff`; work branch `feat/connected-designs-phase-5`. Nothing pushed or deployed.
