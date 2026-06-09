# Tasks: SDD Community Voting Platform

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1900 (19 files) |
| 800-line risk | **High** |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Chained PRs (base: main)

- **PR 1** Phase 1
- **PR 2** Phases 2-4
- **PR 3** Phase 5
- **PR 4** Phases 6-7

## Phase 1: Foundation

- [ ] 1.1 `package.json`: next@16, drizzle-orm, @neondatabase/serverless, @clerk/nextjs, @clerk/testing, zod; dev: vitest, @testing-library/{react,jest-dom}, @electric-sql/pglite, drizzle-kit
- [ ] 1.2 TDD `vitest.config.ts` + `tests/setup.ts` (RTL + jsdom + aliases)
- [ ] 1.3 TDD `db/schema.ts` — 6 tables, `uq_vote_user_phase`, `uq_model_name_provider`
- [ ] 1.4 `db/index.ts` — PGlite tests, NeonDB prod (env-switched)
- [ ] 1.5 TDD `db/seed.ts` — 10 phases, 10 providers, ~30 models, idempotent
- [ ] 1.6 `drizzle.config.ts` + `.env.example` — NeonDB URL, `DATABASE_URL`, `NEXT_PUBLIC_CLERK_*`

## Phase 2: Queries

- [ ] 2.1 TDD `getPhases(providerId?)` — CTE + `RANK() OVER (PARTITION BY phase_id ORDER BY COUNT(*) DESC)`, top-2, ties, zero-votes → null
- [ ] 2.2 TDD provider filter `WHERE $1::int IS NULL OR v.provider_id = $1`
- [ ] 2.3 TDD `getModels(providerId?)` + `getProviders()` — empty=all, unknown=`[]`
- [ ] 2.4 TDD `upsertVote()` — `ON CONFLICT (user_id, phase_id) DO UPDATE` + `vote_history` INSERT in one tx
- [ ] 2.5 `lib/types.ts` — `PhaseWithRankings`, `VotePayload`, `ApiResponse<T>`

## Phase 3: Auth

- [ ] 3.1 TDD `requireUser()` — wraps Clerk `auth()`; throws 401 when no session
- [ ] 3.2 TDD `syncUser()` — upsert Clerk user (id, name, avatarUrl) on first sign-in
- [ ] 3.3 TDD `validateModelProvider()` — modelId+provider must match `models`, else 400

## Phase 4: API Routes

- [ ] 4.1 TDD `app/api/phases/route.ts` GET — 200 + array, `?provider=` filter
- [ ] 4.2 TDD `app/api/models/route.ts` GET — 200, filtered or full
- [ ] 4.3 TDD `app/api/providers/route.ts` GET — 200, all 10
- [ ] 4.4 TDD `app/api/votes/route.ts` POST — 401/400/201, upsert+history, `revalidatePath` after COMMIT

## Phase 5: UI

- [ ] 5.1 `pnpx shadcn@latest add card dialog select button badge`
- [ ] 5.2 TDD `components/phase-card.tsx` — slug/name/responsibility/description, "Sin votos aún" null, "Empate — N votos" tie
- [ ] 5.3 TDD PhaseCard Clerk boundary — `<SignedOut>` → sign-in, `<SignedIn>` → "Votar"
- [ ] 5.4 TDD `components/vote-modal.tsx` — Dialog + cascading provider→model Select, POSTs and closes
- [ ] 5.5 TDD `components/provider-filter.tsx` — "Todos" + 10 providers, onChange updates `useSearchParams`
- [ ] 5.6 Empty state: "Sin votos para este proveedor" (PF-04)

## Phase 6: Shell

- [ ] 6.1 `app/layout.tsx` — `<ClerkProvider>`, theme, metadata
- [ ] 6.2 `app/page.tsx` — server component, fetch phases, render `ProviderFilter` + `PhaseCard` grid
- [ ] 6.3 `components/sign-in-button.tsx` — Clerk `<SignInButton>` Discord OAuth

## Phase 7: Verify

- [ ] 7.1 Vitest — >80% coverage on `lib/queries.ts` + `lib/auth.ts`
- [ ] 7.2 `pnpm build` — Next.js 16 prod build succeeds
- [ ] 7.3 Smoke: seed dev DB → vote via UI → `revalidatePath` updates tally
- [ ] 7.4 Update `openspec/config.yaml` `test_command` + `build_command`
