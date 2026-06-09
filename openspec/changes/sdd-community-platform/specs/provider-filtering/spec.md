# Provider Filtering Specification

## Purpose

Dropdown filter allowing users to narrow phase card model displays by AI provider across all 10 providers.

## Requirements

| ID | Requirement | Strength | Summary |
|----|------------|----------|---------|
| PF-01 | Provider dropdown | MUST | Render dropdown with all 10 providers from seed data plus "Todos" option |
| PF-02 | Filter phase cards | MUST | Selecting a provider SHALL pass it to GET /api/phases?provider=X, narrowing main/fallback results |
| PF-03 | Clear filter | MUST | "Todos" option SHALL remove provider param, restoring full results |
| PF-04 | No results state | MUST | When selected provider has no votes, SHALL show "Sin votos para este proveedor" |
| PF-05 | Filter persistence | SHOULD | Filter state SHOULD persist across re-renders (e.g., after voting) |

## Scenarios

### Scenario: Select provider filters cards

- GIVEN 10 phase cards visible showing all providers
- WHEN user selects "Anthropic Pro" from dropdown
- THEN GET /api/phases?provider=anthropic-pro is called AND only Anthropic models appear

### Scenario: Clear filter shows all providers

- GIVEN provider filter set to "OpenAI Plus"
- WHEN user selects "Todos" option
- THEN provider param is removed AND all provider models reappear

### Scenario: No votes for selected provider

- GIVEN provider "OpenRouter (Free)" has zero votes across all phases
- WHEN user filters by "OpenRouter (Free)"
- THEN "Sin votos para este proveedor" displayed for each phase card

### Scenario: Filter persists after voting action

- GIVEN user selected "Anthropic Pro" filter
- WHEN user casts a vote and page refreshes
- THEN filter state remains "Anthropic Pro"
