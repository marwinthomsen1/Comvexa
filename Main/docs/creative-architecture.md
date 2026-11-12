# Active architecture — Creative platform

## Product and phase boundaries

Comvexa: Create once. Use everywhere. Learning features and the former ten-phase roadmap are canceled. Historical files remain recoverable. Phase 2 delivers the website and frontend workspace foundation with a prepared, locally tested database migration. It does not deliver the editor, uploads, generation, billing or cloud authentication.

The application currently has two deliberately separate domains:

1. **Public browser-local preview**: projects/campaigns/preferences under `comvexa:creative-preview:v1`. No login, no passwords, no simulated session, no server data. Local storage is not a security boundary, an account or a backup. Errors preserve existing bytes and avoid claiming successful saves.
2. **Future authenticated cloud workspace**: Supabase verified identity, RLS, server validation and persistent projects. Disabled endpoints return 503; never trust local preview state or client-supplied owner IDs as identity.

Do not automatically migrate browser drafts to a future account. Offer explicit import with validation, ownership reassignment from verified identity and confirmation later.

## Runtime modules

Routes compose UI features. Workspace provider calls validated local store functions; forms share input rules. Public metadata and template concepts live in config. No service SDK, private credential, server database connection, session cookie, or external network request exists in the frontend.

Use `src/lib/design-document/schema.js` as the starting contract for a renderer-independent document. Its version, canvas, elements and bindings belong to Comvexa. Phase 3 must validate the full element schema before persistence. The current blank-document helper does not create editor functionality or design assets.

## Future boundaries

- **Editor**: client-only, lazy loaded, consumes document state; must not own campaign content or database identity. Evaluate Konva versus Fabric using text editing, image crop, touch, export and reopen tests before selection.
- **Templates**: immutable versioned documents with field slots. `src/config/site.js` currently contains concept metadata only; no promise that these are ready-to-apply templates.
- **Connected content**: campaign field IDs, typed values and revision. Per-element binding stores source field and explicit override mode. Layout/style remain design-owned. Updating shared data must not flatten layouts or silently overwrite local overrides. Include overflow policy and reconnect actions. Build binding-aware document structure in Phase 3; full shared-field UX is Phase 5.
- **Assets**: private object IDs and ownership, not expiring signed URLs in saved documents. Validate type/signature/byte/pixel limits; plan safe browser decoding, CORS, orphan cleanup and independent object backups. No bucket or upload endpoint is created yet.
- **Exports**: resolve one consistent document/campaign revision, load fonts/images, render with bounded dimensions, and report errors. PNG/JPG/PDF each require separate acceptance tests. No PDF print-quality, bleed, CMYK, or vector claims before testing. No export library installed yet.

## Database migration

`supabase/migrations/202611120001_creative_foundation.sql` creates profiles, campaigns and project metadata. Each exposed table has enabled and forced RLS; authenticated CRUD uses auth.uid() ownership checks. Anonymous grants are revoked. Projects use a composite (campaign_id, owner_id) foreign key to prevent referencing another user's campaign. Name/description/format constraints and ownership indexes are included.

The migration is versioned and **has not been run against any Supabase project**. Do not run on a database containing an existing profiles/campaigns/projects schema. It must fail rather than silently adopt an old platform schema. No storage bucket, existing policy, customer data or deployment was touched.

`supabase/tests/bootstrap.sql` emulates auth.users/auth.uid() and roles only inside a fresh in-memory PGlite test database. Never apply that fixture to Supabase. The tests execute real PostgreSQL RLS and foreign keys, but do not verify hosted JWT issuance, PostgREST configuration, email delivery or Storage behavior.

## Required separate development configuration

No Supabase project or credentials were available; the authorized frontend fallback is active. Adding values to .env.local alone intentionally does not enable cloud functionality.

Before actual account integration:

1. Establish a separate Comvexa creative-development project; record and verify its project reference. Never reuse the old Comvexa project or production keys.
2. Configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_DEV_PROJECT_REF and APP_ORIGIN in ignored .env.local. Keep values out of chat, screenshots and commits. Ordinary authenticated CRUD should not need a service-role key.
3. Review/apply the migration only to that verified development database. No automated migration/deployment command is configured in this repo.
4. Install compatible Supabase browser/SSR SDKs and implement verified server sessions, safe cookies, refresh, login/logout, email confirmation and recovery; validate every server input. Use the current official SSR guidance. Restrict redirects to known local/dev origins and rate-limit account operations.
5. Replace disabled API handlers with authenticated operations; derive owner_id from verified identity. Keep a server/client boundary and prevent unverified preview data from entering these paths.
6. Run integration tests with two disposable users through the actual hosted API: anonymous denial, cross-user denial, owner write/read, cross-owner campaign rejection, session expiration, logout, confirmation/recovery, and clear error states. Keep private tokens out of logs.
7. Keep the local preview and cloud workspace clearly separate. Make no production deployment or DNS changes.

Official references: https://supabase.com/docs/guides/auth/server-side/nextjs and https://supabase.com/docs/guides/database/postgres/row-level-security.

## Active roadmap

1. Audit and architecture: approved.
2. Website foundation: current. Local frontend works; cloud auth remains blocked on isolated service setup and integration.
3. Core editor: approval required; prove library suitability, element schema, history, persistence, basic rendering and individually tested exports.
4. Templates and design packages: curated template families, structured inputs and multi-format layouts.
5. Connected designs: campaign fields, overrides, reconnect, revision-aware updates and export invalidation.
6. Testing and optimization: performance budgets, real mobile usability, file handling, access controls, restore tests.
7. Public launch: separate approval for hosting, rollout/rollback and domain changes.
