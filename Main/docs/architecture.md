> Historical learning-platform plan. Superseded by [creative architecture](creative-architecture.md). Retained for recovery; do not implement this roadmap.

# Architecture and future integration plan

## Phase boundaries

Phase 1 is a local-only foundation. Main contains the new website and eventual learning app. Admin stays empty. No production project, existing application, domain, or database is connected. Add route groups and feature modules only when actual routes and logic need them; avoid empty scaffolding.

## Future module boundaries

- `src/app/(marketing)`, `(auth)`, `(learning)`: route groups once Phase 2/3 require them.
- `src/features/{quick-answer,tutor,materials,quizzes,flashcards,mastery}`: feature-specific components and logic as introduced.
- `src/lib/ai`: server-only provider adapter; features depend on an application-owned request/result contract, not model-specific parameters.
- `src/lib/auth`, `supabase`, `usage`: server session verification, database clients, and atomic usage enforcement after approval.

Do not install service SDKs until the relevant phase.

## AI contract (Phase 4, planned only)

Read OPENAI_API_KEY and OPENAI_MODEL only inside server-only modules. Never use NEXT_PUBLIC_ for private keys. GPT-6 Luna (`gpt-6-luna`) is the candidate, not a hardcoded application dependency. Reverify official model documentation, account availability, pricing, parameters, and evaluation results before implementation. Missing configuration must produce an unavailable response; do not silently select a more expensive fallback model.

Flow: authenticate → validate → authorize materials → atomically reserve quota and budget → call adapter → stream bounded output → persist actual usage and reconcile reservation. Track model, request ID, input/output tokens, estimated costs and status; avoid recording raw private prompts in operational logs. Bound context, output tokens, concurrent requests, retries, daily/monthly user quotas and total monthly spend. Include idempotency, cancellation reconciliation, abandoned-reservation recovery, timeouts, rate limits and a global kill switch. Do not rely on a client counter or vendor budget notifications as the hard cap. Changing models requires adapter capability checks and evaluations, not rewriting UI features.

## Supabase (Phase 3 onward, planned only)

Use new isolated projects and credentials; never reuse the old production database. Supabase Auth owns identities. Proposed data includes profiles/preferences, conversations/messages, materials/chunks, assessments/items/attempts, decks/cards/reviews, topic progress, usage/reservations, and entitlements. Billing tables arrive in Phase 9.

Enable RLS on exposed tables, validate parent-child ownership on writes, index ownership and common query filters, and test two-user read/write isolation. Verify server sessions. Keep upload buckets private; storage policies and short-lived signed URLs govern access. Never allow browsers to edit usage balances, answer keys, scores or entitlements. Avoid privileged service keys in ordinary user request paths.

Plan file signature validation, size/page/pixel limits, safe extraction, bounded background jobs, source references, prompt-injection defenses, retention/deletion and independent database/object recovery tests. Treat AI-generated content as untrusted for rendering. Do not execute migrations during Phase 1.

## Hosting and payments (future)

Separate preview and production environments and credentials. Review a commercial hosting plan, function limits and region before Vercel setup. No domain or DNS changes until an explicit launch decision. Phase 9 selects a PHP-capable payment provider, validates webhook signatures, handles duplicate/out-of-order events, and grants server-controlled Free/Plus entitlements. No provider selected or connected yet.

## Approval-gated roadmap

2. Website Design & Frontend: approved page map, responsive navigation, public pages and mock learning layouts; build, keyboard and visual review.
3. Authentication & Database: new isolated services, schema, Auth and RLS; session and two-user isolation tests.
4. OpenAI & Quick Answer: adapter, streaming, usage tracking and spending caps; real account compatibility, concurrency and failure tests.
5. AI Tutor: guided sessions, bounded memory and saved history; representative learning-quality evaluations.
6. Materials: private uploads, safe extraction and source references; invalid/large-file and ownership tests.
7. Quizzes, Exams & Flashcards: validated generation, protected answer keys and server scoring; scoring and submission tests.
8. Mastery & Progress: topic evidence, derived progress and recommendations; reproducible calculations.
9. Subscriptions, Payments & Admin: verified billing lifecycle, entitlements and separate role-protected admin app; webhook and access tests.
10. Testing, Optimization & Launch: accessibility, performance, abuse controls, restore test, monitoring, rollout and rollback. Deploy only after explicit approval.

Every phase needs approval before beginning. Security is implemented with each feature and verified again at launch.
