# Identifier Backfill

Updated: 2026-03-25 13:00 +08:00

## Document Position

This document defines the governance path for historical login identifier cleanup in `auth-service`.

## Goal

- Stop treating compatibility dual-lookup as a permanent implementation strategy
- Backfill historical `LoginMethod.identifier` data into the current normalized format
- Remove repository fallback lookup after verified cleanup

## Current Effective Rules

- email: `trim + lowercase`
- phone:
  - remove non-digits
  - if the original value starts with `+`, preserve a single leading `+`

Reference implementation:
- [auth-identifier-normalizer.ts](../../src/domain/services/auth-identifier-normalizer.ts)

## Current Compatibility Debt

Current repository behavior still supports:
- original identifier lookup
- normalized identifier lookup

Current cleanup target:
- [prisma.loginmethod.repository.ts](../../src/infrastructure/repositories/prisma/prisma.loginmethod.repository.ts)
  - `findByTypeAndIdentifier`
  - `findValidOneByTypeAndIdentifier`

## Execution Plan

### Step 1. Freeze normalization rules

- Treat the current normalizer as the only legal target format
- Do not introduce more compatibility branches

### Step 2. Inventory historical data

- Scan `LoginMethod.identifier`
- Find values that differ from their normalized form
- Detect collisions after normalization

### Step 3. Run backfill

- Rewrite historical identifiers to the normalized target
- Review any collision cases before final commit

### Step 4. Remove compatibility lookup

- Delete dual-lookup behavior from repository methods
- Keep only normalized lookup

### Step 5. Regression check

- Rebuild
- Re-run login flows:
  - email + password
  - email + OTP
  - phone + password
  - phone + OTP
  - MFA challenge creation and submission
  - risk throttle lookup aggregation

## Non-Goals

- Real email / SMS transport integration
- Operator context integration
- Identity-service data migration

## Related Task

- [../tasks/cred-01-identifier-backfill.md](../tasks/cred-01-identifier-backfill.md)
