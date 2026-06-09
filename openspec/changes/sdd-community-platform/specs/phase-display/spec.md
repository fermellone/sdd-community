# Phase Display Specification

## Purpose

Render 10 SDD phase cards with real-time community rankings via SQL RANK() aggregation. Public read, no auth required.

## Requirements

| ID | Requirement | Strength | Summary |
|----|------------|----------|---------|
| PD-01 | Render phase cards | MUST | Display 10 cards (slug, name, responsibility, description) from seed data |
| PD-02 | Compute main/fallback | MUST | RANK() OVER (PARTITION BY phase_id ORDER BY COUNT(*) DESC) for top-2 per phase with vote counts and voter identity |
| PD-03 | Zero votes state | MUST | Show "Sin votos aún" placeholder when no votes exist |
| PD-04 | Tie handling | MUST | When RANK() ties, display as "Empate — N votos" |
| PD-05 | Public visibility | MUST | Phases and rankings publicly accessible without authentication |
| PD-06 | Provider filter interaction | SHOULD | When provider filter is active, main/fallback restricted to that provider's models |

## Scenarios

### Scenario: Ten phase cards render with seed data

- GIVEN seed data with 10 SDD phases (sdd-explore through sdd-onboard)
- WHEN the home page loads via GET /api/phases
- THEN 10 cards render with slug, name, responsibility, and description

### Scenario: Main and fallback models display vote counts

- GIVEN votes for phase "sdd-explore": Claude 3.5 Sonnet (42 votes), GPT-4o (38 votes)
- WHEN GET /api/phases returns aggregated rankings
- THEN mainModel = {name: "Claude 3.5 Sonnet", provider: "anthropic-pro", votes: 42}
- AND fallbackModel = {name: "GPT-4o", provider: "openai-plus", votes: 38}

### Scenario: Zero votes state

- GIVEN phase "sdd-init" has no votes
- WHEN the phase card renders
- THEN "Sin votos aún" placeholder is displayed, no model badges shown

### Scenario: Tie for top position

- GIVEN two models tied at rank 1 with 15 votes each for a phase
- WHEN results are computed with RANK()
- THEN both display as "Empate — 15 votos" badge

### Scenario: Provider filter restricts visible models

- GIVEN provider filter set to "openai-plus"
- WHEN phase cards render
- THEN main/fallback slots only contain models from provider "openai-plus"
