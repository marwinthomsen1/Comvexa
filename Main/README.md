# Comvexa — Create once. Use everywhere.

Creative design platform by Marwin Thomsen. Worldwide audience, initially focusing on the Philippines. Phase 5 adds connected campaign fields and shared updates to editable templates and automatic design packages to the browser-local editor and approved website. Cloud services remain unavailable.

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
- Login/registration form previews with local validation and explicit unavailable states.
- Validated browser-local persistence with load/save error states. Up to 100 projects and 100 campaigns.
- Prepared PostgreSQL migration with ownership policies, tested in isolated PGlite.

## Important boundaries

The local workspace is public and **not authenticated**. Its data belongs to this browser profile and origin, not an account. Anyone using the same browser profile can see it. It is neither encrypted storage nor a durable backup. Clearing browser data loses drafts. Do not enter sensitive information. Workspace planning drafts still use localStorage. Design documents use separate IndexedDB transactions with revision conflict checks. Cloud persistence must preserve those checks. No local draft is automatically uploaded later.

Cloud registration, login, sessions, recovery emails and persistence are **not implemented or enabled**. `/api/auth` POST and `/api/projects` GET/POST fail closed with HTTP 503 and never accept a fake preview identity. The form previews do not transmit, log or store passwords. Do not enter real passwords. Adding environment variables alone will not activate a service.

The editable template library and four-format package generator are available. Actual connected-content propagation across saved designs remains future work. Preview artwork and the price illustration are not generated designs. No payment, ads, analytics, remote fonts or image services are connected. The site remains noindex.

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

Open `/dashboard/templates` to browse 32 editable compositions across eight categories and four ratios. `/dashboard/packages` maps your information and up to four uploaded photos into coordinated editable artwork, saved with a campaign in IndexedDB. All saving remains local. See [Phase 4 report](docs/phase-4-report.md) for storage migration, test results, limitations and review instructions.

## Phase 5 connected designs

Open `/dashboard/campaigns`, choose a generated campaign, and select **Manage connected information**. Edit shared fields, preview linked designs, then save the campaign atomically. In an individual editor, select text or an image to connect, override, restore, or detach it. Campaigns and images stay in this browser; portable editor project downloads include their campaign snapshot. See [Phase 5 report](docs/phase-5-report.md).

## Editor upgrade — Stage A

The [Stage A report and staged plan](docs/editor-upgrade-stage-a.md) covers the redesigned editor navigation, contextual panels, Lucide icons, mobile drawers and verification. Stages B–E await approval; existing v1 documents remain compatible.
