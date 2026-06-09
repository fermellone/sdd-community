## Exploration: SDD Community Voting Platform

### Current State

This is a **greenfield project** — no code exists yet. The stack has been defined in `openspec/config.yaml`:
- **Framework**: Next.js 16 (App Router)
- **Package Manager**: pnpm
- **Database**: NeonDB (serverless PostgreSQL)
- **Auth**: Clerk (Discord OAuth only)
- **UI**: ShadCN (install via `pnpx`)
- **Testing**: Strict TDD enabled, no test runner configured yet

The goal is a community website where members vote on the best AI model for each of the 10 SDD phases defined by Gentleman Programming.

### Affected Areas

Since this is greenfield, ALL areas are "new":

- `app/` — Next.js App Router pages, layouts, and API routes
- `components/` — React components (PhaseCard, VoteModal, ProviderFilter)
- `db/` — Drizzle schema, migrations, seed scripts
- `lib/` — Shared utilities (db client, auth helpers, API clients)
- `providers/` — React context providers (Clerk, query client)
- `tests/` — Vitest unit/component tests, Playwright E2E (optional)

### Approaches

#### 1. Database Access Layer: Drizzle ORM vs Prisma

| Criterion | Drizzle ORM | Prisma |
|-----------|-------------|--------|
| **Bundle size** | ~50KB (lightweight) | ~500KB+ (heavier runtime) |
| **Serverless cold start** | Fast (no binary) | Slower (Rust query engine binary) |
| **NeonDB integration** | Native `drizzle-orm/neon-serverless` driver | Works via `@prisma/adapter-neon` |
| **Schema definition** | TypeScript-first, SQL-like syntax | Prisma Schema Language (DSL) |
| **Migrations** | `drizzle-kit` CLI | `prisma migrate` CLI |
| **Type safety** | Excellent (inferred from schema) | Excellent (generated client) |
| **SQL control** | Full SQL access, window functions easy | Abstracted, raw SQL needed for complex queries |
| **Learning curve** | Lower if you know SQL | Higher (new DSL to learn) |
| **Community** | Growing, smaller | Large, mature |

**Pros of Drizzle**:
- Native NeonDB serverless driver (HTTP + WebSocket)
- Lightweight — ideal for serverless/edge
- SQL-like syntax — no new DSL
- Window functions for vote aggregation are natural SQL
- Better fit for the "CONCEPTS > CODE" philosophy

**Cons of Drizzle**:
- Smaller community, fewer tutorials
- No built-in GUI like Prisma Studio (use `drizzle-kit studio` which is newer)

**Pros of Prisma**:
- Mature ecosystem, Prisma Studio GUI
- Excellent migration system
- Large community

**Cons of Prisma**:
- Heavier cold starts in serverless (Rust binary)
- Prisma Schema DSL is another language to learn
- NeonDB adapter is secondary (not first-class like Drizzle)
- Complex aggregations (window functions) require raw SQL anyway

**Effort**: Low for both (schema is small)

**Recommendation**: **Drizzle ORM** — lighter, native NeonDB support, SQL-first approach aligns with understanding fundamentals.

---

#### 2. Model List Source: Provider APIs vs Hardcoded Seed

| Provider | Endpoint | Auth Required | Notes |
|----------|----------|---------------|-------|
| **OpenAI** | `GET https://api.openai.com/v1/models` | Yes (API key) | Returns all models including deprecated |
| **Anthropic** | `GET https://api.anthropic.com/v1/models` | Yes (API key + version header) | Returns Claude models |
| **OpenRouter** | `GET https://openrouter.ai/api/v1/models` | No (public) | Returns 300+ models from all providers |
| **OpenCode** | None found | N/A | No public API — must be hardcoded |

**Option A: Fetch from Provider APIs at Runtime**

**Pros**:
- Always up-to-date model lists
- No manual maintenance
- Users see latest models immediately

**Cons**:
- Requires storing API keys for OpenAI and Anthropic (security concern)
- Rate limits on model listing endpoints
- Cold start latency (multiple API calls)
- OpenCode has no API — still need hardcoded fallback
- Complexity: need to normalize different response formats
- Caching required to avoid repeated calls

**Option B: Hardcoded Seed List (with periodic updates)**

**Pros**:
- No API keys needed
- Instant response (no external calls)
- Predictable, testable
- Can curate the list (only relevant models)
- Simple implementation

**Cons**:
- Manual updates when new models release
- Can become stale
- Need to decide which models to include

**Option C: Hybrid — Seed + Optional API Refresh (cron job)**

**Pros**:
- Best of both worlds
- Seed provides baseline, API refresh keeps it current
- No runtime dependency on external APIs
- Can run refresh as a scheduled job (Vercel cron)

**Cons**:
- More complex implementation
- Need to handle API failures gracefully

**Effort**: Low (A), Very Low (B), Medium (C)

**Recommendation**: **Option B (Hardcoded Seed)** for MVP. The model list is relatively stable, and users are voting on specific models they know. A curated list of ~20-30 popular models per provider is sufficient. Can evolve to Option C later.

---

#### 3. Voting Computation: SQL Window Functions vs JavaScript

**Option A: SQL Window Functions (Recommended)**

```sql
SELECT 
  phase_id,
  model_id,
  provider,
  vote_count,
  RANK() OVER (PARTITION BY phase_id ORDER BY vote_count DESC) as rank
FROM (
  SELECT phase_id, model_id, provider, COUNT(*) as vote_count
  FROM votes
  GROUP BY phase_id, model_id, provider
) aggregated;
```

**Pros**:
- Database does the heavy lifting (efficient)
- Single query returns all phases with rankings
- Handles ties naturally (RANK vs ROW_NUMBER)
- Scales well with more votes
- Can filter by provider in the same query

**Cons**:
- More complex SQL to write and test
- Need to understand window functions

**Option B: JavaScript Computation**

```typescript
const votes = await db.select().from(votesTable);
const grouped = votes.reduce((acc, vote) => {
  const key = `${vote.phaseId}-${vote.modelId}-${vote.provider}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});
// Sort and pick top 2 per phase...
```

**Pros**:
- Easier to understand for JS developers
- Flexible logic

**Cons**:
- Loads ALL votes into memory (doesn't scale)
- Multiple queries or complex JS logic
- Slower for large datasets
- Tie handling must be manually implemented

**Effort**: Medium (A), Low (B)

**Recommendation**: **Option A (SQL Window Functions)** — correct tool for the job, scales well, teaches proper SQL patterns.

---

#### 4. Project Structure

Recommended Next.js 16 App Router layout:

```
sdd-community/
├── app/
│   ├── layout.tsx              # Root layout (Clerk provider, fonts, metadata)
│   ├── page.tsx                # Home page (phase cards grid)
│   ├── globals.css             # Global styles + ShadCN theme
│   └── api/
│       ├── phases/
│       │   └── route.ts        # GET /api/phases — list phases with top models
│       ├── votes/
│       │   └── route.ts        # POST /api/votes — cast a vote
│       └── models/
│           └── route.ts        # GET /api/models?provider=X — list models
├── components/
│   ├── ui/                     # ShadCN components (auto-generated)
│   ├── phase-card.tsx          # Phase card with vote counts
│   ├── vote-modal.tsx          # Voting dialog
│   └── provider-filter.tsx     # Provider dropdown filter
├── db/
│   ├── schema.ts               # Drizzle schema definitions
│   ├── index.ts                # DB client (NeonDB serverless)
│   ├── migrate.ts              # Migration runner
│   └── seed.ts                 # Seed script (phases + models)
├── lib/
│   ├── auth.ts                 # Clerk helpers (get current user)
│   ├── queries.ts              # Reusable DB queries (vote aggregation)
│   └── types.ts                # Shared TypeScript types
├── providers/
│   └── clerk-provider.tsx      # Clerk wrapper (client component)
├── tests/
│   ├── unit/                   # Vitest unit tests
│   ├── components/             # React Testing Library tests
│   └── e2e/                    # Playwright (optional)
├── drizzle.config.ts           # Drizzle Kit config
├── vitest.config.ts            # Vitest config
├── next.config.ts              # Next.js config
├── package.json
├── tsconfig.json
└── .env.local                  # Local env vars (NEON_DB_URL, CLERK_*)
```

---

#### 5. Database Schema Design

```typescript
// db/schema.ts
import { pgTable, text, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

// Users table (linked to Clerk)
export const users = pgTable('users', {
  id: text('id').primaryKey(),           // Clerk user ID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SDD Phases (seed data — 10 rows)
export const phases = pgTable('phases', {
  id: integer('id').primaryKey(),        // 1-10
  slug: text('slug').notNull().unique(), // 'sdd-explore', 'sdd-propose', etc.
  name: text('name').notNull(),          // 'Exploración', 'Propuesta', etc.
  responsibility: text('responsibility').notNull(), // sub-header
  description: text('description').notNull(), // paragraph
});

// AI Models (seed data — curated list)
export const models = pgTable('models', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),          // 'GPT-4o', 'Claude 3.5 Sonnet', etc.
  provider: text('provider').notNull(),  // 'openai-plus', 'anthropic-pro', etc.
  // Unique constraint: model name + provider
}, (table) => ({
  uniqueModelProvider: uniqueIndex('unique_model_provider').on(table.name, table.provider),
}));

// Votes
export const votes = pgTable('votes', {
  id: integer('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  phaseId: integer('phase_id').notNull().references(() => phases.id),
  modelId: integer('model_id').notNull().references(() => models.id),
  provider: text('provider').notNull(),  // Denormalized for easier querying
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // One vote per user per phase per model per provider
  uniqueVote: uniqueIndex('unique_user_phase_model_provider')
    .on(table.userId, table.phaseId, table.modelId, table.provider),
}));
```

**Provider enum values** (stored as text for flexibility):
- `openai-plus` — OpenAI Plus
- `openai-pro-x5` — OpenAI Pro (x5)
- `openai-pro-x10` — OpenAI Pro (x10)
- `anthropic-pro` — Anthropic Pro
- `anthropic-max-x5` — Anthropic Max (x5)
- `anthropic-max-x10` — Anthropic Max (x10)
- `opencode-go` — OpenCode Go
- `opencode-zen` — OpenCode Zen
- `openrouter-free` — OpenRouter (Free)
- `openrouter-payg` — OpenRouter (PAYG)

---

#### 6. API Design

**GET /api/phases**

Returns all 10 phases with their top 2 models (main + fallback) and vote counts.

```typescript
// Response shape
{
  phases: [
    {
      id: 1,
      slug: 'sdd-explore',
      name: 'Exploración',
      responsibility: 'Investigación inicial...',
      description: '...',
      mainModel: { name: 'Claude 3.5 Sonnet', provider: 'anthropic-pro', votes: 42 } | null,
      fallbackModel: { name: 'GPT-4o', provider: 'openai-plus', votes: 38 } | null,
    },
    // ... 9 more phases
  ]
}
```

Optional query param: `?provider=anthropic-pro` to filter by provider.

**POST /api/votes**

Cast a vote. Requires authentication (Clerk session).

```typescript
// Request body
{
  phaseId: 1,
  modelId: 5,
  provider: 'anthropic-pro'
}

// Response
{ success: true, vote: { id: 123, ... } }
// Or 409 Conflict if already voted
```

**GET /api/models**

List available models, optionally filtered by provider.

```typescript
// GET /api/models?provider=anthropic-pro
{
  models: [
    { id: 5, name: 'Claude 3.5 Sonnet', provider: 'anthropic-pro' },
    { id: 6, name: 'Claude 3 Opus', provider: 'anthropic-pro' },
  ]
}
```

---

#### 7. Component Tree

```
<ClerkProvider>
  <RootLayout>
    <HomePage>
      <ProviderFilter />           {/* Dropdown to filter by provider */}
      <div className="grid">
        <PhaseCard phase={...} />  {/* x10, one per phase */}
          ├── CardHeader (name, responsibility)
          ├── CardContent (description)
          ├── CardFooter
          │   ├── MainModel badge (name + vote count)
          │   ├── FallbackModel badge (name + vote count)
          │   └── <SignedIn><Button onClick={openModal}>Votar</Button></SignedIn>
          │   └── <SignedOut><SignInButton /></SignedOut>
        </div>
      </div>
      <VoteModal phase={...} />    {/* Dialog opened by Vote button */}
        ├── Select (provider dropdown — required)
        ├── Select (model dropdown — populated by provider)
        └── Button (submit vote)
    </HomePage>
  </RootLayout>
</ClerkProvider>
```

**ShadCN components needed**:
- `card` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `dialog` — Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle
- `select` — Select, SelectTrigger, SelectValue, SelectContent, SelectItem
- `button` — Button
- `badge` — Badge (for vote counts)
- `label` — Label (for form fields)

Install command: `pnpx shadcn@latest add card dialog select button badge label`

---

#### 8. Test Strategy (Strict TDD)

**Test Runner**: Vitest + React Testing Library

**Layers**:
1. **Unit tests** (`tests/unit/`)
   - Vote aggregation logic (SQL query helpers)
   - Provider filter logic
   - Type guards and validators

2. **Component tests** (`tests/components/`)
   - PhaseCard renders correctly with/without models
   - VoteModal opens/closes, validates form
   - ProviderFilter updates selected provider

3. **API tests** (`tests/api/`)
   - GET /api/phases returns correct shape
   - POST /api/votes creates vote, rejects duplicates
   - Auth middleware rejects unauthenticated requests

4. **E2E tests** (`tests/e2e/`) — Optional, Playwright
   - Full voting flow: sign in → select phase → vote → see updated counts

**NeonDB Branching for Tests**:
- Create a schema-only branch for tests: `neonctl branches create --schema-only`
- Run migrations on the test branch
- Use `TEST_DATABASE_URL` env var pointing to the test branch
- Clean up branch after test suite

**Clerk Testing Mocks**:
- Use `@clerk/testing` package
- For unit/component tests: mock `useAuth()` and `useUser()` hooks
- For API tests: mock `auth()` from `@clerk/nextjs/server`
- For E2E: use Clerk's testing tokens + Agent Tasks

---

#### 9. Voting Logic: Handling Ties

When two models have the same vote count:

**Option A**: Use `RANK()` — both get rank 1, next gets rank 3
**Option B**: Use `ROW_NUMBER()` with secondary sort (e.g., by `created_at` of first vote)

**Recommendation**: Use `RANK()` and display both as "main" if tied. The UI can show "Tied with X votes" badge.

---

### Recommendation

1. **Database**: Drizzle ORM with `neon-serverless` driver
2. **Model list**: Hardcoded seed (curated ~30 models), evolve to API refresh later
3. **Vote computation**: SQL window functions (`RANK()`)
4. **Project structure**: Standard Next.js 16 App Router with `src/` optional
5. **Testing**: Vitest + RTL for unit/component, Playwright for E2E (optional)
6. **Auth**: Clerk with Discord-only, mock in tests

### Risks

1. **NeonDB cold starts**: Serverless Postgres can have cold starts. Mitigation: use connection pooling (Neon's built-in pooler) and keep warm with periodic pings.

2. **Clerk Discord-only auth**: If Discord OAuth has issues, users can't sign in. Mitigation: consider adding GitHub as fallback later.

3. **Vote manipulation**: One vote per user per phase/model/provider prevents spam, but users could create multiple Discord accounts. Mitigation: accept this for MVP, add reputation system later.

4. **Model list staleness**: Hardcoded list won't include new models. Mitigation: add a "Suggest model" feature or periodic API refresh.

5. **Tie handling UX**: Ties might confuse users. Mitigation: clear UI messaging ("Tied with X votes").

6. **Strict TDD overhead**: Writing tests first for a greenfield project can slow initial development. Mitigation: focus tests on business logic (voting), not UI boilerplate.

### Ready for Proposal

**Yes** — the exploration is complete. The orchestrator should tell the user:

> "Exploration complete. Key decisions: Drizzle ORM (lightweight, native NeonDB), hardcoded model seed (simple, no API keys), SQL window functions for vote ranking. Ready to create a proposal with intent, scope, and approach. Shall I proceed?"
