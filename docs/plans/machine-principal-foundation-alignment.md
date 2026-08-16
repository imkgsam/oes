# Machine Principal Foundation Alignment

> 涉及 permission-service 的权限评估、upper-bound policy 或 delegation scope 边界，必须回写到 [permission-service.md](../architecture/services/permission-service.md) 或新的 ADR。本文只记录 machine principal 跨服务对齐过程，不作为 permission-service 设计真相源。

Updated: 2026-03-25 +08:00

## 1. Purpose

This document aligns `identity-service`, `auth-service`, and `permission-service` before any Phase 3 machine-principal code work starts.

The goal is to prevent `6.1 ServiceAccount` from becoming a narrow local implementation that later conflicts with:

- machine authentication
- delegated AI execution
- machine permission evaluation
- future AI profile expansion

## 2. Core decision

`ServiceAccount` is the first concrete persistence form of a governed machine principal.

It is not:

- an API key table
- an authentication implementation
- a delegated execution token
- a per-user or per-scenario AI identity

## 3. Cross-service responsibility split

### 3.1 `identity-service`

Owns:
- machine principal identity truth
- machine principal type
- machine principal scope level
- machine principal status
- machine principal tenant ownership when applicable

Provides:
- principal lookup
- principal listing
- principal creation
- principal enable/disable management

Does not own:
- API key verification
- token issuance
- delegated execution issuance
- permission evaluation

### 3.2 `auth-service`

Owns:
- machine authentication
- credential verification
- machine token or session issuance
- delegated execution context issuance when AI acts for a human

Consumes from `identity-service`:
- principal existence
- principal status
- principal type
- principal scope level

Does not own:
- machine principal master truth
- permission decision truth

### 3.3 `permission-service`

Owns:
- machine permission upper-bound evaluation
- policy-based restriction on machine actions
- future combination of:
  - machine upper-bound permissions
  - delegated human permissions
  - scenario policy gates

Consumes from `identity-service`:
- principal id
- principal type
- principal scope level
- tenant binding

Consumes from `auth-service`:
- authenticated machine context
- delegated human context when applicable

Does not own:
- machine identity lifecycle
- credential lifecycle

## 4. Interaction model

### 4.1 Direct machine execution

Flow:
1. machine presents credential to `auth-service`
2. `auth-service` verifies credential and resolves machine principal
3. `auth-service` issues authenticated machine context
4. `permission-service` evaluates machine upper-bound permissions
5. tool or business service executes under controlled machine context

### 4.2 Delegated AI execution

Flow:
1. AI runtime uses a governed machine principal
2. human user initiates the task
3. `auth-service` produces delegated execution context
4. `permission-service` evaluates:
   - machine upper bound
   - delegated human scope
   - scenario policy
5. execution proceeds through governed tools only

## 5. Constraints for `6.1`

`6.1` must leave room for the flows above, but must not implement them yet.

Therefore `6.1` should include:
- principal identity schema
- principal type and scope semantics
- minimal query and management interfaces

And `6.1` should exclude:
- API keys
- machine login
- token/session issuance
- delegated execution tokens
- permission policies

## 6. Recommended minimum delivery boundary

### Inside `identity-service` for `6.1`

- schema
  - `ServiceAccount`
- domain
  - principal status and scope semantics
- application query
  - `getServiceAccountById`
  - `listServiceAccounts`
- application management
  - `createServiceAccount`
  - `setServiceAccountEnabled`
- interface
  - minimal gRPC query and management entry points

### Outside `identity-service` for later phases

- `auth-service`
  - machine auth
  - delegation context
- `permission-service`
  - machine permission evaluation

## 6.1 Minimum delivery breakdown

The first code implementation should be intentionally small and should stop at the machine-principal identity boundary.

### A. Schema

Recommended minimum fields for `ServiceAccount`:

- `id`
- `tenantId` or nullable tenant binding according to final scope decision
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

Recommended enums:

- `MachinePrincipalScopeLevel`
  - `SYSTEM`
  - `TENANT`
- `MachinePrincipalType`
  - `INTERNAL_SERVICE`
  - `EXTERNAL_INTEGRATION`
  - `AI_AGENT`
  - `AUTOMATION_BOT`
- `MachinePrincipalStatus`
  - `ACTIVE`
  - `DISABLED`

Do not add `APIKey` fields or embedded authentication concerns into the `6.1` persistence model.

### B. Domain

Minimum domain rules:

- system-level principal and tenant-level principal must be distinguishable
- disabled principal must be queryable but not operationally active
- principal type must be explicit and stable

### C. Application

Minimum queries:

- `getServiceAccountById`
- `listServiceAccounts`

Minimum commands:

- `createServiceAccount`
- `setServiceAccountEnabled`

### D. Interface

Minimum gRPC surface:

- one query service entry for by-id lookup
- one query service entry for listing
- one management entry for create
- one management entry for enable/disable

### E. Tests

Minimum testing expectation:

- L1 rules for scope, type, and enable/disable semantics
- build passes

L2 and L3 may follow after the initial machine-principal shape is stable.

## 6.2 Current repository note

The current repository already contains a historical `ServiceAccount` and `APIKey` draft in `identity-service` Prisma schema.

This draft must not be treated as the accepted implementation target for `6.1`.

Reason:

- it mixes principal concerns and credential concerns
- it predates the current machine-principal foundation interpretation
- it should be reviewed and either aligned or replaced when Phase 3 implementation begins

## 7. Decision rule before implementation

No machine-principal code should start until the team accepts the following interpretation:

- `identity-service` owns principal truth
- `auth-service` owns authentication and delegation issuance
- `permission-service` owns permission evaluation

If this split is accepted, `6.1` can proceed safely as a reusable foundation.

## 8. Implementation status 2026-03-25

The first code step of `6.1` is now in place inside `identity-service`.

Implemented:

- principal-only `ServiceAccount` schema
- machine-principal scope/type/status enums
- minimum query and management CQRS handlers
- minimum gRPC query and management endpoints
- L1 validation and guard coverage

Still intentionally deferred:

- credential model
- machine auth
- delegation issuance
- permission integration beyond future consumption contracts

## 9. Verification follow-up 2026-03-26

The first implementation step of `6.1` has now been verified beyond build and L1:

- `ServiceAccount` repository L2 coverage added
- machine-principal enum constraint checks added

Important note:

- local verification required a direct schema sync on the test database
- `prisma db push` was used only to restore the local test environment to the current `identity-service` schema
- this does not replace migration-based environment governance

Current open technical debt:

- one existing org-membership partial unique constraint is still absent from the locally synced database
- this remains a SQL-level constraint restoration problem outside the direct `ServiceAccount` scope
