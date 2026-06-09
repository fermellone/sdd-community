# Model Catalog Specification

## Purpose

Curated, hardcoded catalog of ~30 AI models across 10 providers, loaded via seed script. Used as the reference for voting model selection.

## Requirements

| ID | Requirement | Strength | Summary |
|----|------------|----------|---------|
| MC-01 | Seed model data | MUST | ~30 curated models across 10 providers, loaded via db/seed.ts |
| MC-02 | Provider grouping | MUST | Each model belongs to exactly one provider; unique on (name, provider) |
| MC-03 | Filter by provider | MUST | GET /api/models?provider=X returns only models for that provider |
| MC-04 | Empty filter returns all | MUST | GET /api/models without provider param returns all models |
| MC-05 | Non-existent provider | MUST | Return empty array with 200 when provider has no models |

## Scenarios

### Scenario: Seed data loads all models

- GIVEN database is seeded
- WHEN GET /api/models is called
- THEN ~30 models returned across 10 providers, each with id, name, and provider

### Scenario: Filter by provider returns subset

- GIVEN models table contains OpenAI and Anthropic models
- WHEN GET /api/models?provider=anthropic-pro
- THEN only Anthropic models returned (e.g., Claude 3.5 Sonnet, Claude 3 Opus)

### Scenario: Empty filter returns all

- GIVEN models exist for all 10 providers
- WHEN GET /api/models is called without provider param
- THEN all ~30 models are returned

### Scenario: Non-existent provider

- GIVEN no models exist for provider "nonexistent"
- WHEN GET /api/models?provider=nonexistent
- THEN empty array returned with 200 status
