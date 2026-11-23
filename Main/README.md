# Comvexa — Create once. Use everywhere.

Creative design platform by Marwin Thomsen. Worldwide audience, initially focusing on the Philippines. Phase 5 adds connected campaign fields and shared updates to editable templates and automatic design packages to the browser-local editor and approved website. Development Supabase accounts now automatically save and load the signed-in workspace across devices. Local caches support editing between syncs; optional backups remain available.

## Product direction and roadmap

The [expanded roadmap](docs/product-roadmap.md) and [Canva feature matrix](docs/canva-feature-matrix.md) distinguish current capabilities from proposed milestones. Phases 1–5 remain complete; Phase 6 is reliability/security and Phase 7 is public-launch preparation. Major implementation awaits roadmap review.

## Run

Node 24 LTS and npm are required.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No credentials are needed. Dev and production servers bind to loopback only.

```sh
npm run lint
npm test
npm run build
npm start
# In a separate terminal while the local server is running:
npm run test:http
```

## Working now

- Colorful landing page with eight creative categories and a four-format connected-price illustration.
- React Konva design studio at `/editor`: text, shapes, local images, crop/transform/layers, undo/redo, presets, preview and PNG/JPG exports.
- IndexedDB autosave with revision conflict checks and portable JSON project import/export.
- Responsive workspace, project/campaign creation, linking and listings, search/sort, detail views.
- Local profile settings, template concept filtering, persistent light/dark themes.
- Supabase email registration/login, verified cookie sessions and automatic account workspaces. Guest mode remains available.
- Validated browser-local persistence with load/save error states. Up to 100 projects and 100 campaigns.
- Prepared PostgreSQL migration with ownership policies, tested in isolated PGlite.

## Important boundaries

Guest work belongs to the browser profile and is not authenticated. Signed-in work uses an account-specific cache and automatically synchronizes designs, campaigns, embedded images, original media, version history, reviews, brand kits, profile/planning drafts and workspace preferences. Accounts do not share the same local design, media, clipboard, brand or preference namespace. Guest work is preserved separately and can be brought into the signed-in account with the one-time **Bring existing work into my account** action. Local caches are not encrypted; someone with control of the browser profile or device can inspect local storage. Wait for **Saved to your account** before switching devices.

Development email registration, password login, session refresh and logout are enabled only when the verified project configuration and `COMVEXA_CLOUD_AUTH_ENABLED=true` are present. `/api/auth` verifies identity through Supabase; its session cookies are HTTP-only. Registration can require email confirmation. Manual cloud library backups use a private Storage bucket with per-user folder policies. Signed-in workspace changes now save automatically. Shared team access and password-recovery UI are not implemented. `/api/projects` still returns HTTP 503 because remote project metadata CRUD has not been integrated.

The editable template library and four-format package generator are available. Connected campaign fields propagate across saved linked designs locally. Preview artwork and the price illustration are not generated designs. No payment, ads, analytics, remote fonts or image services are connected. The site remains noindex.

## Project map

- `src/app/`: landing, account previews, dashboard routes, fail-closed API routes.
- `src/components/marketing/`: header, responsive campaign ads, animated ribbons/reveals and connected-price demo.
- `src/app/creative.css`: light/dark creative identity and restrained workspace styling.
- `src/lib/motion/`: reduced-motion-aware reveal and offscreen-pause lifecycle.
- `src/components/{layout,ui}/`: brand, icons, theme control.
- `src/features/auth/`: account preview forms.
- `src/features/workspace/`: provider, shell, creation dialog, lists/details/settings/templates.
- `src/lib/workspace/`: validated local persistence and input rules.
- `src/lib/auth/`: validation and disabled-cloud contract.
- `src/lib/design-document/`: original versioned document foundation.
- `src/lib/editor/`: validated application schema, commands/history, image safety, IndexedDB adapter and export renderer.
- `src/features/editor/`: lazy client editor, canvas, properties and responsive styling.
- `src/app/editor/`: design library and editor routes.
- `src/config/site.js`: public product and template-concept data.
- `supabase/migrations/`: unapplied migration for a NEW development project only.
- `supabase/tests/`: Auth fixture used only in local PostgreSQL tests.
- `tests/`: Node tests including actual SQL RLS enforcement; HTTP smoke script.
- `docs/creative-architecture.md`: active design and next integration steps.
- `docs/phase-2-report.md`: implementation and verification report.
- `docs/history/`, `docs/architecture.md`, `docs/phase-1-report.md`: retained historical learning documentation.

Admin remains empty and unimplemented. Git does not track empty directories.

## Recovery and Git

Initial baseline: `7519a3d`. Recovery tag: `recovery/pre-creative-phase-2`. Active development branch: `feat/creative-phase-2`. The baseline was created before application changes using the local automation author `Codex <codex@localhost>` because no Git author identity was configured. No remote, push, deployment or production change was made.

To inspect the old source without resetting current work:

```sh
git show recovery/pre-creative-phase-2:Main/src/app/page.js
```

Do not use a hard reset to review the baseline. Environment files, build output, dependencies and private-key files are ignored. `.env.example` intentionally contains empty names only.

## Dependencies

Existing stack retained: Next.js 16.4.6, React 19.3.1, Tailwind CSS 4.3.5, ESLint 10.14.0. Added **development-only** `@electric-sql/pglite` 0.5.16 for PostgreSQL RLS tests; it is not imported by application code. Prettier was run as a one-off formatting tool, not added as a dependency.

ESLint uses recommended JavaScript and official Next.js rules. The existing minimatch 11.0.5 override remains; revisit when upstream dependencies include the security fix. JSX component imports are excluded from core unused-variable detection. Full React Hooks/accessibility lint coverage and browser automation are not yet installed.

## Next approval gate

A separate Supabase development project and cloud integration verification are needed for actual accounts. See the architecture guide. Phase 3 requires explicit approval and begins with an editor-library proof of concept. Do not connect the old database or modify comvexa.net.

## Phase 2 visual upgrade

The approved reference images guided a colorful purple/pink/orange/cyan visual identity. CSS transform/opacity motion, local optimized product artwork, and a synchronized ₱950 → ₱850 illustration are implemented without adding runtime dependencies. Local projects, campaigns, profiles and authentication boundaries are unchanged. See [design upgrade report](docs/design-upgrade-report.md) for verification and the generated asset prompt. Phase 3 remains unstarted.

## Phase 3 review

See [editor architecture](docs/editor-architecture.md) and [Phase 3 report](docs/phase-3-report.md). Saved documents contain embedded image data; downloads are the backup mechanism. Phase 5 Connected Designs is implemented locally; see [Phase 5 report](docs/phase-5-report.md).

## Phase 4 templates and packages

Open `/dashboard/templates` to browse 100 individually authored editable compositions across nine categories, 15 styles and seven formats. The original 32 recipe IDs remain compatible with earlier connected packages. See the [curated library report](docs/template-library-upgrade-report.md) and `/template-review/index.html` for all 100 actual previews. `/dashboard/packages` maps your information and up to four uploaded photos into coordinated editable artwork, saved with a campaign in IndexedDB. All saving remains local. See [Phase 4 report](docs/phase-4-report.md) for storage migration, test results, limitations and review instructions.

## Phase 5 connected designs

Open `/dashboard/campaigns`, choose a generated campaign, and select **Manage connected information**. Edit shared fields, preview linked designs, then save the campaign atomically. In an individual editor, select text or an image to connect, override, restore, or detach it. Campaigns and images stay in this browser; portable editor project downloads include their campaign snapshot. See [Phase 5 report](docs/phase-5-report.md).

## Editor upgrade — Stage A

The [Stage A report and staged plan](docs/editor-upgrade-stage-a.md) covers the redesigned editor navigation, contextual panels, Lucide icons, mobile drawers and verification. Stage B and the transform polish are complete; later stages await approval. Existing v1 documents remain compatible.

## Editor upgrade — Stage B

[Stage B report](docs/editor-upgrade-stage-b.md): multiple selection, flat groups, proportional transforms, local clipboard, alignment/distribution, snapping, visibility and batch layers. Group/visibility edits use schema v2 with a pre-upgrade portable backup for existing saved v1 designs. Stage C awaits approval.

## Expanded Elements library

The editor's **Elements** tool now includes 79 original editable shapes and graphics, with search, seven categories, a color picker and responsive tile grids. All vectors support the existing transforms, layers, grouping, clipboard, local saving and PNG/JPG exports. See the [expanded elements report](docs/expanded-elements-report.md) for compatibility, testing and preview instructions.

## Editor upgrade — Stage C

[Stage C report](docs/editor-upgrade-stage-c.md): 54 fonts, searchable previews/categories/recent fonts, italic/underline/spacing, native editable shadows/outlines/glow/offset/neon/gradients and ten text presets. Fonts are self-hosted and loaded on demand; selected fonts are awaited before project rendering/export. Curved text is deferred. Stage D has not started.

## Local workflow and recovery update

- **Guided creation** at `/dashboard/start` takes a product, restaurant offer or event brief into the existing four-format package builder. Open it from Home’s **Guide me** button.
- **Review & history** in the editor includes checks across all pages for text overflow, off-canvas text, low image resolution, contrast against identifiable solid backgrounds, and optional print text margins. Checks are advisory; gradient/photo contrast and printer-specific bleed are not inferred.
- **Version history** archives the previous saved document and its connected campaign snapshot in the same transaction as each edit. Retention is up to 10 previous revisions within a 40 MB budget per design (the latest previous revision is retained even when larger than the budget). Restore creates a new independent design/campaign copy. History begins with this update; it cannot reconstruct earlier saves.
- **Local review notes** support comments, resolution and Draft / Ready for review / Changes requested / Approved states. Reviews reference a saved design revision and reject conflicting edits. Names are self-reported, and approval is not authenticated team sign-off. A newer design revision requires review again.
- **Campaign review** shows changed fields, affected element counts and preserved overrides, plus saved/proposed previews. Campaign-wide styles apply to all pages and save atomically with shared information. Unused empty fields are collapsed by default.
- **Backups & recovery** at `/dashboard/backups` is linked from Account and Settings. JSON backups include the design library, connected campaigns, embedded photos, original video/audio files and local review notes, including trashed designs. Imports validate first and restore new copies; designs, campaigns, reviews and restored media commit in one IndexedDB transaction. Limits: 200 designs, 100 campaigns, 200 original media sources, 100 MB per backup. Larger libraries can use individual project/video ZIP downloads. Version history, brand kits, profile settings and planning drafts are excluded. Restored discussions are retained as context and review status resets to Draft.

Editing, history and review remain browser-local. Development cloud accounts and manual backup uploads were subsequently added as described below. Continuous cloud sync, authenticated team access and remote review sharing remain deferred. No old database or production website is connected. The storage upgrade preserves existing design, campaign and thumbnail stores.

Validation: `npm test`, `npm run lint`, `npm run build`, and `npm run test:http`. `tests/reliability.test.mjs` covers revision retention, stale writes, storage rollback, all-page checks/styles, exact-revision review, connected library copy imports and original media recovery.


## Development Supabase connection — November 22, 2026

The newly provided development project has been verified through its public Auth endpoint. `.env.local` is ignored by Git and contains the URL, publishable key, expected project reference, localhost origin and explicit auth enablement. No service-role key is used. Package versions are pinned.

- `/register` and `/login` now submit to server-side Supabase Auth. `/api/auth` also provides verified account status and local session logout. All session operations run in route handlers, where refreshed cookies can be written; there is no browser-side session-token storage. Requests use origin checks, bounded input and a bounded process-local attempt limit alongside Supabase provider limits. The process-local limit is not a distributed production rate limiter.
- `/dashboard/backups` offers manual private cloud uploads (50 MB maximum), lists the 100 newest copies, and downloads a chosen copy into the existing validation/restore preview. Uploads include designs, campaigns, embedded photos, original media and local review notes. Restore remains an explicit local action and creates new copies. Uploads and downloads verify the account on every server request and derive the storage folder from that identity.
- `supabase/migrations/202611220001_cloud_library_backups.sql` was applied manually to the new development project through its SQL Editor, after verifying that Storage had no buckets or policies. It creates only the private `comvexa-library-backups` bucket and authenticated owner-folder SELECT/INSERT policies. No anonymous read policy, overwrite or delete policy is added. The earlier metadata migration remains unapplied.
- Registration confirmation and the first authenticated upload/download still require a real user to create/confirm a Comvexa account. A Supabase dashboard account is separate from a Comvexa app account. No test signup emails or user-library uploads are sent by the development checks.
- Localhost remains the development origin. No deployment, DNS, old project, account password, or existing local design was changed.

`tests/cloud.test.mjs` covers explicit config gating, project-reference matching, trusted origins, bounded JSON bodies, attempt limits and actual PostgreSQL storage-policy isolation for two users and anonymous access. HTTP smoke tests reject spoofed identities and cross-origin writes.


## Automatic account saving — November 23, 2026

Signed-in work now syncs automatically and loads before the workspace/editor opens on a new device. Existing guest data stays intact; the one-time import action associates it with the selected account. No manual backup upload or restore is required for subsequent signed-in work. Successful login/logout performs a full navigation so in-memory state cannot leak between account namespaces. Session changes block the workspace until identity is verified again.

The sync engine sends content-addressed chunks (4 MB each) to the private `comvexa-account-sync` bucket, then publishes a manifest through the `commit_account_sync` PostgreSQL function. Identity is verified server-side for every request and matched against the expected account. The function uses a row lock and expected revision so a stale device cannot silently replace a newer manifest. The schema and owner-only policies in `supabase/migrations/202611230001_account_sync.sql` were applied to the new development project.

Three-way comparison merges changes to separate records. When both devices edit the same record, saving pauses with explicit version choices; replaced device data is retained in up to three local recovery snapshots, accessible from Backups & recovery. An atomic local transaction preserves design revisions, campaigns, review approval state, history and original media without creating duplicate/restored design IDs. Generation checks prevent downloading an account snapshot over edits that completed while a network request was in flight. Brand Kit forms also reject stale saves after a synchronized update.

Changes debounce for about 1.8 seconds after a device save; active workspaces check account changes every 12 seconds and retry on focus/reconnection. Logout attempts to flush account changes first. An already-open workspace retains edits during a network interruption and retries automatically; a cold start still needs account verification. The save indicator distinguishes pending, saving, saved, offline, expired-session and conflicting states. Manual local/cloud backup features remain extra recovery options.

Current development limits: 400 MB of account data, 5,000 manifest records and 100 MB per individual record; existing design/media limits still apply. Old immutable cloud chunks are retained; automated garbage collection and storage-quota management are not implemented. Thumbnails are regenerated locally, and clipboard contents and device recovery snapshots remain device-specific. No deployment or DNS changes were made; access from another physical device still requires hosting the app at an accessible URL.

Validation includes multi-device simulations, stale-write rejection, offline replay, concurrent local edits, media/history/brand/profile transfer, account namespace isolation, actual PostgreSQL RLS/CAS tests and a development-only read-only browser check at `/dev/account-sync-validation`. The latter loads a real signed-in account into two empty in-memory clients without browser-cache reads or cloud writes.
