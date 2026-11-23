# Comvexa

Create once. Use everywhere.

The current Comvexa application lives in [`Main/`](Main/): a Next.js creative studio with editable designs and templates, connected campaigns, image and video tools, brand kits, and automatic Supabase account saving.

## Run locally

Use Node.js 24 and npm:

```sh
cd Main
npm ci
cp .env.example .env.local
# Configure the new development Supabase project in .env.local.
npm run dev
```

Open http://localhost:3000. Guest work stays on the device. Signed-in work automatically saves to the account and loads across devices. Existing guest work can be brought into an account once from the workspace banner.

`.env.local` and credentials are excluded from Git. Supabase configuration names are documented in [`Main/.env.example`](Main/.env.example). Never put a secret or service-role key in a `NEXT_PUBLIC_` variable.

## Validate

From `Main/`:

```sh
npm test
npm run lint
npm run build
# With the local development server running:
npm run test:http
```

See [`Main/README.md`](Main/README.md) for feature details, account sync, recovery, storage limits and development setup. Database migrations are in [`Main/supabase/migrations/`](Main/supabase/migrations/); review them for a new isolated project before applying them. Do not rerun migrations already applied to an existing project.

For hosting, set the application root directory to `Main` and configure the environment in the hosting provider. Committing the repository does not configure hosted environment variables.
