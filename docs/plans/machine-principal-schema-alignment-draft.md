# Machine Principal Schema Alignment Draft

Updated: 2026-03-25 +08:00

## 1. Purpose

This draft aligns the existing historical `ServiceAccount / APIKey` Prisma sketch in `identity-service` with the accepted `6.1` interpretation:

- `6.1` is machine-principal foundation
- `6.2` is credential model

This document is a schema alignment draft only.

It does not yet change:

- proto contracts
- command/query definitions
- repository implementations
- auth-service or permission-service behavior

## 2. Current schema problems

The existing Prisma draft has the following issues:

1. `ServiceAccount` mixes principal and credential concerns
- includes `hashedSecret`
- includes `apikey`

2. `APIKey` is already implemented in the same phase boundary
- this violates the current `6.1` / `6.2` split

3. `APIKey` is modeled as one-to-one
- current design direction expects one principal to support multiple credentials later

4. `Level` and `ServiceType` are too narrow for the current machine-principal interpretation

5. lifecycle fields are too weak
- `isEnable` is not enough for explicit governance and audit

6. creator semantics are duplicated
- `creatorId`
- `createdBy`

## 3. Recommended 6.1 target schema

### 3.1 Model name

Keep `ServiceAccount` as the persistence model name for `6.1`.

Reason:
- it matches current service documentation
- it is the first concrete form of machine principal

But semantically, it must be treated as a governed machine principal.

### 3.2 Recommended fields

Recommended minimum fields:

- `id`
- `tenantId` (nullable for `SYSTEM`, required for `TENANT`)
- `scopeLevel`
- `type`
- `name`
- `description`
- `status`
- `createdAt`
- `updatedAt`
- `createdBy`
- `disabledAt`
- `disabledBy`

### 3.3 Recommended enums

#### `MachinePrincipalScopeLevel`

- `SYSTEM`
- `TENANT`

#### `MachinePrincipalType`

- `INTERNAL_SERVICE`
- `EXTERNAL_INTEGRATION`
- `AI_AGENT`
- `AUTOMATION_BOT`

#### `MachinePrincipalStatus`

- `ACTIVE`
- `DISABLED`

## 4. Field-by-field alignment proposal

### 4.1 Fields to keep

- `id`
- `tenantId`
- `name`
- `description`
- `createdAt`
- `updatedAt`
- `createdBy`

### 4.2 Fields to rename

- `level` -> `scopeLevel`
- `isEnable` -> `status`

### 4.3 Fields to remove from `6.1`

- `clientId`
- `creatorId`
- `hashedSecret`
- `apikey`

Reason:
- `clientId` belongs to authentication-facing identity shape and can be reintroduced later only if needed
- `creatorId` overlaps with `createdBy`
- `hashedSecret` is credential concern
- `apikey` is `6.2` concern

### 4.4 Fields to add

- `disabledAt`
- `disabledBy`

Reason:
- explicit lifecycle governance
- audit-friendly state transitions

## 5. `APIKey` handling decision

For `6.1`, the recommended decision is:

- do not implement `APIKey`
- do not keep `APIKey` in the `6.1` target schema surface

There are two acceptable implementation paths later:

1. remove `APIKey` from the active Prisma model during `6.1`, then reintroduce it in `6.2`
2. leave it in history only and do not use it until `6.2`

Preferred path:
- remove or isolate it from the `6.1` implementation target, so the phase boundary stays explicit

## 6. Tenant binding decision

Accepted decision:

- use `Option B`
- system-level principals have `tenantId = null`
- tenant-level principals have `tenantId != null`

### Reason

This keeps tenant binding semantically clean:

- `tenantId` means real tenant ownership
- platform or system scope is not represented as a fake tenant

### Required semantic constraint

The implementation must enforce:

- `scopeLevel = SYSTEM` -> `tenantId IS NULL`
- `scopeLevel = TENANT` -> `tenantId IS NOT NULL`

This may first be enforced in application/domain validation and later strengthened with database constraints if needed.

## 7. Recommended implementation order

When Phase 3 code starts:

1. align Prisma schema to the 6.1 target
2. generate Prisma client
3. implement domain entity and repository
4. implement minimal queries and commands
5. expose minimal gRPC interfaces
6. add L1 tests

## 8. Decision summary

For `6.1`, `ServiceAccount` should be implemented as:

- governed machine principal identity
- principal-only schema
- `tenantId = null` for `SYSTEM` principals
- `tenantId != null` for `TENANT` principals
- no credential semantics
- no machine auth semantics
- no permission semantics

This is the narrowest implementation that still leaves a reusable foundation for the later AI platform.
