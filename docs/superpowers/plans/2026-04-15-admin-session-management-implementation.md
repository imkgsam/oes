# Admin Session Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the first-stage administrator session management flow with an online-user overview, per-user session list, and single-session revoke safeguards.

**Architecture:** Extend the existing `auth-service -> auth-bff -> tenant-web` admin-session path instead of creating a parallel model. Add one new admin query for the online-user overview, keep per-user session inspection as the second-level view, and enforce the "cannot revoke current operator session" rule in the backend so the UI can consume a stable error.

**Tech Stack:** NestJS, CQRS, gRPC/proto contracts, Redis-backed auth-service session repository, Vue tenant-web, Jest, pnpm.

---

### Task 1: Add the downstream online-user overview contract and query

**Files:**
- Modify: `src/common/src/contracts/auth_service/auth.proto`
- Modify: `src/common/src/generated/auth_service/auth.ts`
- Modify: `src/services/system/auth-service/src/domain/repositories/user-session.repository.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/redis/session/redis-user-session.repository.ts`
- Modify: `src/services/system/auth-service/src/application/queries/session/index.ts`
- Create or Modify: `src/services/system/auth-service/src/application/queries/session/admin-list-online-users.handler.ts`
- Create or Modify: `src/services/system/auth-service/src/application/queries/session/admin-list-online-users.query.ts`
- Modify: `src/services/system/auth-service/src/interfaces/grpc/auth.grpc.controller.ts`
- Test: `src/services/system/auth-service/src/application/queries/session/admin-list-online-users.handler.spec.ts`

- [ ] Write the failing auth-service query test for tenant-scoped and system-scoped online-user aggregation.
- [ ] Run the focused auth-service test and confirm it fails for the missing query path.
- [ ] Implement the minimal repository + query + gRPC contract changes.
- [ ] Re-run the focused auth-service tests and confirm they pass.

### Task 2: Expose the overview in auth-bff and enforce revoke-current-session protection

**Files:**
- Modify: `src/services/api-gateway/src/modules/auth-bff/infrastructure/downstream/auth-service/auth-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/dtos/admin-security.dto.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/view-models/admin-security.view-model.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.spec.ts`
- Test: `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.spec.ts`
- Test: `src/services/system/auth-service/src/application/commands/auth/admin-revoke-session.handler.spec.ts`

- [ ] Write the failing auth-bff/controller tests for `GET /auth/admin/online-users`.
- [ ] Write the failing revoke test for rejecting the operator's current session.
- [ ] Run the focused tests and confirm they fail for the new behavior.
- [ ] Implement the minimal adapter / use case / controller / handler changes.
- [ ] Re-run the focused backend tests and confirm they pass.

### Task 3: Reshape the tenant-web page to the new two-level flow

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/admin-security/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/auth-session-management.vue`
- Test if present: tenant-web tests for the admin page; otherwise validate with typecheck/build

- [ ] Add the failing front-end API/types usage for the online-user overview.
- [ ] Implement the page flow as "online users -> target user sessions -> single revoke".
- [ ] Keep audit tab behavior intact while preventing the old manual-user-id investigation path from remaining the default entry.
- [ ] Run tenant-web typecheck/build and any focused tests.

### Task 4: Verify the end-to-end slice and update docs if behavior changed

**Files:**
- Modify if needed: `docs/plans/features/admin-session-management.md`
- Modify if needed: `docs/contracts/api-gateway/auth-bff-admin-security.md`

- [ ] Run focused auth-service Jest suites for the new query and revoke rule.
- [ ] Run focused api-gateway Jest suites for controller/use case coverage.
- [ ] Run tenant-web typecheck/build.
- [ ] Re-read the feature packet and contracts and confirm they still match the implementation.
