# Comvexa · Phase 1

A new AI learning platform by Marwin Thomsen. English-first, initially serving the Philippines; future subscription currency: PHP.

## Run locally

Use Node.js 24 LTS (`nvm use` if nvm is installed) and npm.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. No environment variables are required for Phase 1.

```sh
npm run lint
npm run build
npm start
```

The dev and production servers bind only to loopback. No deployment is configured. The page deliberately requests no indexing until launch readiness is reviewed.

## Implemented

Next.js App Router, React, JavaScript, Tailwind CSS v4, ESLint, npm lockfile, `@/*` imports, semantic light/dark tokens, theme persistence with system preference as initial default, reusable brand/icon/theme components, button/card/input styles, and an honest nonfunctional feature preview. All assets are local; no remote fonts, analytics, auth, AI or payment calls.

## Structure

- `src/app/`: root layout, placeholder page, global design tokens and primitives.
- `src/components/layout/`: brand component.
- `src/components/ui/`: icons and theme control.
- `src/config/site.js`: public brand and feature preview content.
- `public/icon.svg`: local brand icon.
- `docs/architecture.md`: future architecture, security and phase boundaries.
- `.env.example`: empty variable names only; no values are required.
- `.nvmrc`, `jsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `eslint.config.mjs`: runtime and tooling configuration.

Git is initialized in the workspace root so Main and the future Admin share one repository. Admin remains empty; Git does not track empty directories. No commit or remote is created. Never commit `.env` files, `.next`, node_modules, credentials, or generated artifacts.

## Design

Midnight navy #101827, teal #12B8A6, off-white #F6F8FC, lavender #A78BFA. Semantic CSS variables drive both themes and Tailwind tokens. Darker teal is used for light-background text. System fonts avoid build-time network dependencies. Reduced-motion preferences disable transitions and smooth scrolling. Feature previews are articles, not pretend actions. The only actions are theme switching and navigation to the preview section.

## Not implemented

Accounts, learning logic, file uploads, databases, API routes, AI, payments, Admin, a complete marketing website, or a dashboard. Do not add production credentials to test this foundation. The old application and comvexa.net remain outside this project's scope.

Phase 2 requires explicit approval. See `docs/architecture.md` for the roadmap and future service contracts.

## Tooling notes

ESLint 10 uses its recommended JavaScript rules plus the official Next.js recommended/Core Web Vitals rules. JSX component names are excluded from the core unused-variable rule because the core parser does not treat JSX tags as variable references. React Hooks and broader JSX accessibility lint rules are not installed in this minimal phase; browser/accessibility review is still required as components grow.

`minimatch` is overridden to patched 11.0.5 for the ESLint dependency chain, addressing GHSA-g3hv-75wg-m249. This crosses the upstream major range; installation, lint and build passed with this resolution. Revisit/remove the override when ESLint's upstream dependencies incorporate the patch. Do not use force or legacy-peer-deps to bypass installation conflicts.

See `docs/phase-1-report.md` for verification results and known limits.
