# Proposal: SDD Community Voting Platform

## Proposal Question Round ✅ Resolved

1. **Vote uniqueness**: One vote per user per phase (single model+provider tuple).
2. **Vote changes**: Allowed, with change history (audit trail via `vote_history` table).
3. **Result visibility**: Public — anyone can see rankings and tallies.
4. **Attribution**: Public identity — who voted what is visible.

---

## Intent

Create a community-driven leaderboard where practitioners vote on the best AI model for each of the 10 SDD phases. Replace fragmented, subjective recommendations with transparent, data-backed rankings.

## Scope

### In Scope
- 10 phase cards (name, responsibility, description, main/fallback model + counts)
- Voting modal: model selector + mandatory provider dropdown (10 providers)
- Provider filter
- Discord-only Clerk auth
- ~30 hardcoded seed models
- SQL `RANK()` aggregation
- Strict TDD: Vitest + RTL

### Out of Scope
- API-key model refresh, vote audit history, admin panel, non-Discord OAuth, E2E tests

## Capabilities

### New Capabilities
- `phase-display`: 10 cards with ranked model info
- `model-catalog`: ~30 curated models across 10 providers
- `voting`: Auth-gated vote casting (one per user per phase), upsert with change history, public tally + identity, RANK() aggregation
- `provider-filtering`: Dropdown filtering by provider
- `auth`: Clerk Discord-only, protected API routes

### Modified Capabilities
None — greenfield.

## Approach

Next.js 16 + Drizzle ORM + NeonDB. Seed via `db/seed.ts`. `POST /api/votes` (Clerk-protected, unique on `userId+phaseId`, upsert with `vote_history` trail). `GET /api/phases` (public) runs `RANK() OVER (PARTITION BY phase_id ORDER BY COUNT(*) DESC)` for top-2 per phase, includes voter identity. Provider filter via `WHERE` clause. UI: ShadCN Card, Dialog, Select, Badge.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/` | New | Layout, home page, API routes |
| `components/` | New | PhaseCard, VoteModal, ProviderFilter |
| `db/` | New | Drizzle schema, seed, migrations |
| `lib/` | New | Auth, queries, types |
| `providers/` | New | ClerkProvider |
| `tests/` | New | Vitest + RTL suites |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| NeonDB cold starts | Medium | Connection pooling, keep-alive |
| Discord OAuth outage | Low | Accept; GitHub fallback later |
| Vote alt-account spam | Low | Unique constraint; accept for MVP |
| Model staleness | Medium | Curated seed; suggest-model post-launch |

## Rollback Plan

Revert deployment. Voting data preserved (additive-only schema, no cascade deletes).

## Dependencies

- NeonDB connection string, Clerk app (Discord OAuth), pnpm

## Success Criteria

- [ ] 10 phases render with seeded data and vote counts
- [ ] Auth user casts vote; tally updates
- [ ] Duplicate → `409`, unauthenticated → `401`
- [ ] Provider filter narrows correctly
- [ ] Test suite passes: >80% business-logic coverage
