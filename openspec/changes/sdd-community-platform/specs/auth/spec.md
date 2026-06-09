# Authentication Specification

## Purpose

Discord-only authentication via Clerk, protecting vote mutation endpoints while keeping phase and model data publicly readable.

## Requirements

| ID | Requirement | Strength | Summary |
|----|------------|----------|---------|
| AU-01 | Discord OAuth only | MUST | Clerk SHALL be configured with Discord as the sole OAuth provider |
| AU-02 | Protected POST routes | MUST | POST /api/votes SHALL require valid Clerk session; 401 otherwise |
| AU-03 | Public GET routes | MUST | GET /api/phases and GET /api/models SHALL be public (200 without session) |
| AU-04 | Sign-in UI | MUST | <SignedOut> SHALL render Discord sign-in button; <SignedIn> SHALL render vote button |
| AU-05 | Session propagation | MUST | Clerk session accessible in API routes via auth() from @clerk/nextjs/server |
| AU-06 | User sync | MUST | User record (Clerk ID, email, name) SHALL be synced to users table on first sign-in |

## Scenarios

### Scenario: Discord OAuth flow succeeds

- GIVEN Clerk configured with Discord provider
- WHEN user clicks "Iniciar sesión con Discord"
- THEN user is redirected to Discord OAuth, authenticates, and returns with active session

### Scenario: Protected route rejects unauthenticated access

- GIVEN no Clerk session exists
- WHEN POST /api/votes is called
- THEN response 401 with "Authentication required"

### Scenario: Public route accessible without session

- GIVEN no Clerk session exists
- WHEN GET /api/phases is called
- THEN response 200 with full phase data

### Scenario: Signed-out user sees sign-in button

- GIVEN user is not authenticated
- WHEN phase card renders
- THEN <SignedOut> shows "Iniciar sesión con Discord" instead of vote button

### Scenario: Signed-in user sees vote button

- GIVEN user is authenticated via Discord
- WHEN phase card renders
- THEN <SignedIn> shows "Votar" button that opens VoteModal
