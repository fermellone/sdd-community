# Voting Specification

## Purpose

Auth-gated vote casting with upsert semantics, change history audit trail, and public tally via SQL RANK() aggregation.

## Requirements

| ID | Requirement | Strength | Summary |
|----|------------|----------|---------|
| VT-01 | Cast vote | MUST | POST /api/votes (body: phaseId, modelId, provider) creates vote for authenticated user; returns 201 |
| VT-02 | Auth gate | MUST | Unauthenticated POST /api/votes SHALL return 401 |
| VT-03 | One vote per user per phase | MUST | Unique constraint on (userId, phaseId); re-vote SHALL upsert modelId and provider |
| VT-04 | Vote change history | MUST | Upsert SHALL insert into vote_history (userId, phaseId, oldModelId, newModelId, oldProvider, newProvider, changedAt) |
| VT-05 | Public tally + identity | MUST | GET /api/phases SHALL include voter names and vote counts per model via RANK() aggregation |
| VT-06 | Valid model-provider pairing | MUST | modelId+provider MUST match a valid pair from models table; invalid SHALL return 400 |

## Scenarios

### Scenario: Authenticated user casts vote

- GIVEN user is signed in via Discord OAuth
- WHEN POST /api/votes with {phaseId: 1, modelId: 5, provider: "anthropic-pro"}
- THEN vote is created, response 201 with vote details

### Scenario: Unauthenticated request rejected

- GIVEN no active Clerk session
- WHEN POST /api/votes with valid body
- THEN response 401 with "Authentication required"

### Scenario: Re-vote upserts and creates history

- GIVEN user already voted for model 5 (anthropic-pro) on phase 1
- WHEN POST /api/votes with {phaseId: 1, modelId: 8, provider: "openai-plus"}
- THEN vote row upserted to model 8 AND vote_history entry records oldModelId=5 → newModelId=8 with timestamp

### Scenario: Public tally includes voter names

- GIVEN 3 users voted for Claude 3.5 Sonnet on phase 1
- WHEN GET /api/phases returns
- THEN mainModel includes voteCount=3 AND voter identities are visible

### Scenario: Invalid model-provider pair rejected

- GIVEN model 5 exists under "anthropic-pro" only
- WHEN POST /api/votes with {phaseId: 1, modelId: 5, provider: "openai-plus"}
- THEN response 400 with "Invalid model-provider combination"
