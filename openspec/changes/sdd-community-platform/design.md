# Design: SDD Community Voting Platform

## Technical Approach

Next.js 16 App Router + Drizzle ORM + NeonDB serverless PG. Server component fetches aggregated phases via `RANK()` window functions; client components handle auth-gated voting via Clerk-protected API routes. Hardcoded seed (~30 models across 10 providers) loaded at migration time. Strict TDD: Vitest + RTL, Clerk mocked via `@clerk/testing`.

## Architecture Decisions

| Decision | Option | Tradeoff | Verdict |
|----------|--------|----------|---------|
| ORM | Drizzle vs Prisma | Drizzle: lighter cold starts, native NeonDB HTTP driver, SQL-like syntax. Prisma: heavier binary, needs adapter for Neon. | **Drizzle** — serverless-first, SQL window functions are natural. |
| Model catalog | Seed vs API fetch | API fetch needs API keys, multiple formats, caching. Seed is predictable, no runtime dependency. | **Hardcoded seed** — MVP simplicity. Evolve to cron-based refresh later. |
| Vote aggregation | SQL RANK() vs JS reduce | JS loads all votes into memory (unscalable). SQL does it in one query, handles ties natively. | **SQL RANK()** — database-level computation, efficient at scale. |
| Vote upsert | INSERT...ON CONFLICT vs manual check-then-insert | Manual: race condition risk. ON CONFLICT: atomic, PostgreSQL-native. | **ON CONFLICT DO UPDATE** — atomic upsert with `vote_history` trigger via transaction. |
| Auth mocking | @clerk/testing vs manual mocks | @clerk/testing: official package, real session shapes. Manual: fragile, drift-prone. | **@clerk/testing** — canonical mocks for `auth()` and `useAuth()`. |

## Database Schema (Drizzle)

```typescript
// db/schema.ts — all tables, constraints, indexes

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // "anthropic-pro", "openai-plus", etc.
});

export const phases = pgTable("phases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  responsibility: text("responsibility").notNull(),
  description: text("description").notNull(),
  slug: text("slug").notNull().unique(),
});

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
}, (t) => ({
  uniqueNameProvider: uniqueIndex("uq_model_name_provider").on(t.name, t.providerId),
}));

export const users = pgTable("users", {
  id: text("id").primaryKey(), // clerk user ID
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  phaseId: integer("phase_id").references(() => phases.id).notNull(),
  modelId: integer("model_id").references(() => models.id).notNull(),
  providerId: integer("provider_id").references(() => providers.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniqueVote: uniqueIndex("uq_vote_user_phase").on(t.userId, t.phaseId),
}));

export const voteHistory = pgTable("vote_history", {
  id: serial("id").primaryKey(),
  voteId: integer("vote_id").references(() => votes.id).notNull(),
  oldModelId: integer("old_model_id").references(() => models.id),
  oldProviderId: integer("old_provider_id").references(() => providers.id),
  newModelId: integer("new_model_id").references(() => models.id).notNull(),
  newProviderId: integer("new_provider_id").references(() => providers.id).notNull(),
  changedAt: timestamp("changed_at").defaultNow(),
});
```

## SQL Query Plan: Main/Fallback Aggregation

```sql
WITH vote_counts AS (
  SELECT v.phase_id, v.model_id, v.provider_id,
         COUNT(*) AS cnt
  FROM votes v
  JOIN models m ON v.model_id = m.id
  WHERE ($1::int IS NULL OR v.provider_id = $1)
  GROUP BY v.phase_id, v.model_id, v.provider_id
),
ranked AS (
  SELECT *, RANK() OVER (PARTITION BY phase_id ORDER BY cnt DESC) AS rnk
  FROM vote_counts
)
SELECT p.*, r.model_id, r.provider_id, m.name AS model_name,
       prv.name AS provider_name, r.cnt AS votes, r.rnk
FROM phases p
LEFT JOIN ranked r ON p.id = r.phase_id AND r.rnk <= 2
LEFT JOIN models m ON r.model_id = m.id
LEFT JOIN providers prv ON r.provider_id = prv.id
ORDER BY p.id, r.rnk;
```

`$1` = optional provider filter. `rnk <= 2` gives main (rank 1) + fallback (rank 2). Ties: both get same rank, UI shows "Empate — N votos". Zero votes: LEFT JOIN returns NULL → "Sin votos aún".

## API Contracts

**GET /api/phases?provider={slug}** — public
Response: `{ phases: [{ id, slug, name, responsibility, description, main: { modelName, providerName, votes } | null, fallback: { ... } | null }] }`

**POST /api/votes** — Clerk-protected
Request: `{ phaseId: number, modelId: number, providerId: number }`
Response (201): `{ id, userId, phaseId, modelId, providerId }`
Errors: 401 (no session), 400 (invalid model-provider), 409 (duplicate → upsert applied instead)

**GET /api/models?provider={slug}** — public
Response: `{ models: [{ id, name, providerId, providerSlug }] }`

**GET /api/providers** — public
Response: `{ providers: [{ id, name, slug }] }`

## Data Flow

```
Browser                    Next.js Server              NeonDB
  │                            │                         │
  │── GET /api/phases ────────>│                         │
  │                            │── RANK() query ────────>│
  │                            │<── ranked phases ───────│
  │<── JSON (10 cards) ────────│                         │
  │                            │                         │
  │── POST /api/votes ────────>│                         │
  │   (Clerk session cookie)   │── auth() verify ──┐     │
  │                            │<── userId ────────┘     │
  │                            │── BEGIN ───────────────>│
  │                            │── UPSERT votes ────────>│
  │                            │── INSERT vote_history ─>│
  │                            │── COMMIT ──────────────>│
  │<── 201 { vote } ───────────│                         │
  │                            │                         │
  │── revalidatePath("/") ────>│ (server action)         │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `db/schema.ts` | Create | Drizzle tables: providers, phases, models, users, votes, vote_history with constraints |
| `db/index.ts` | Create | NeonDB serverless client via `drizzle-orm/neon-serverless` |
| `db/seed.ts` | Create | Insert 10 phases, 10 providers, ~30 models, upsert-safe |
| `lib/queries.ts` | Create | `getPhases(providerId?)`, `getModels(providerId?)`, `getProviders()`, `upsertVote()` with RANK() SQL |
| `lib/auth.ts` | Create | Clerk `auth()` wrapper for API routes, user sync helper |
| `lib/types.ts` | Create | Shared TS types: PhaseWithRankings, VotePayload, ApiResponse |
| `app/layout.tsx` | Create | Root layout with ClerkProvider, ThemeProvider, metadata |
| `app/page.tsx` | Create | Server component — fetches phases, renders grid + ProviderFilter |
| `app/api/phases/route.ts` | Create | GET handler — runs RANK() query, optional provider filter |
| `app/api/votes/route.ts` | Create | POST handler — Clerk auth gate, upsert + history in transaction |
| `app/api/models/route.ts` | Create | GET handler — filtered or full model list |
| `app/api/providers/route.ts` | Create | GET handler — all providers |
| `components/phase-card.tsx` | Create | Client component — renders card with main/fallback badges, vote button, tie handling |
| `components/vote-modal.tsx` | Create | Client component — Dialog with provider+model Select, submit POST |
| `components/provider-filter.tsx` | Create | Client component — Select dropdown, "Todos" default, searchParams sync |
| `drizzle.config.ts` | Create | Drizzle Kit config pointing to `db/schema.ts` |
| `vitest.config.ts` | Create | Vitest config with RTL setup, alias resolution |
| `package.json` | Create | Dependencies: next, drizzle-orm, @clerk/nextjs, shadcn-ui, @neondatabase/serverless |

**Total**: 19 new files. No modifications or deletions (greenfield).

## Testing Strategy (Strict TDD)

| Layer | What | Approach |
|-------|------|----------|
| Unit | `lib/queries.ts` — RANK() SQL, vote upsert logic | Vitest with in-memory PGlite or mocked NeonDB client |
| Unit | `lib/auth.ts` — user sync, session extraction | Vitest, mock `auth()` from `@clerk/testing` |
| Integration | `POST /api/votes` — auth gate, upsert, history | Vitest + `testcontainers` (NeonDB branch) or PGlite; mock `auth()` |
| Integration | `GET /api/phases` — ranking, provider filter, zero-votes | Same DB strategy; seed test fixture, assert response shape |
| Component | `PhaseCard` — renders with/without models, tie state | RTL, mock fetch, Clerk `<SignedIn>/<SignedOut>` mocked |
| Component | `VoteModal` — form validation, model-provider cascading | RTL, mock `useAuth()` signed-in state |
| Component | `ProviderFilter` — onChange, "Todos" reset | RTL, mock `useSearchParams` |

**TDD flow**: Red (write failing test) → Green (minimal implementation) → Refactor. Business-logic coverage target: >80% per proposal success criteria.

## Open Questions ✅ Resolved

- [x] **PGlite** for integration tests — no network dependency, faster CI, sufficient for integration-level assertions.
- [x] **revalidatePath** after vote — triggers server re-render with correct stale-while-revalidate UX for phase cards.

## Migration / Rollout

No migration required (greenfield). Schema is additive-only — `vote_history` is insert-only, no cascade deletes. Rollback: revert deployment; data preserved.
