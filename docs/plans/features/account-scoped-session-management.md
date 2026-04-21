# Account-Scoped Session Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make self-service session management show and manage only the current `account`'s sessions across devices, while preserving an admin-side cross-user investigation view.

**Architecture:** Keep the underlying session aggregate carrying both `userId` and `accountId`, but split query semantics by caller intent. Self-service session queries and self-service logout actions become `currentAccountId`-scoped, while admin queries keep the broader `user`-scoped view and add explicit account context in results. Context switching should stop surfacing as a second parallel end-user session by reusing the current session identity or, if that proves infeasible, by replacing the prior current-device session atomically.

**Tech Stack:** NestJS, CQRS, Redis session repository, auth-bff gRPC adapter chain, Vue tenant-web.

## 0. Current Status

- Status: completed on 2026-04-17.
- This thread completed the self-service account boundary, context-switch replacement behavior, and end-user wording updates.
- This thread also completed the tenant-web refresh recovery fixes needed for session-management pages to remain usable after access-token expiry.
- This thread explicitly did not extend or redesign admin session management UX. That work remains owned by a separate thread.

### Implemented Outcomes

- Self-service security center now shows only sessions that belong to the currently selected `account`.
- Self-service `logout-other-devices` now revokes only other sessions under the current `account`.
- Self-service `logout-all` now revokes only sessions under the current `account`, including the current session.
- Account switching now replaces the previous current session instead of leaving a second visible parallel session on the same device.
- Self-service UI no longer exposes raw `context-switch` as the primary visible session method in this flow.

### Verification Completed

- `pnpm --dir src/services/system/auth-service exec jest src/application/commands/auth/select-account.handler.spec.ts src/application/queries/session/list-sessions.handler.spec.ts src/application/commands/auth/logout-other-devices.handler.spec.ts src/application/commands/auth/logout-all.handler.spec.ts --runInBand`
- `pnpm --dir src/services/api-gateway exec jest src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts src/modules/auth-bff/application/use-cases/switch-context.use-case.spec.ts --runInBand`
- `pnpm --dir app/web --filter @oes/tenant-web typecheck`
- `VITE_APP_TITLE=OES pnpm --dir app/web/apps/tenant-web exec vitest run --environment happy-dom src/api/request.spec.ts src/store/auth.spec.ts`
- `pnpm --dir app/web/packages/effects/request exec vitest run src/request-client/preset-interceptors.spec.ts`

### Boundary For Other Threads

- Admin session investigation defaults, admin session filtering UX, and any admin-side account aggregation or presentation changes are out of scope for this thread.
- This document should be read as the self-service implementation record, not as an admin-session redesign decision log.

---

## 1. Problem Statement

- Current self-service session pages list sessions by `userId`, not by the selected `accountId`.
- Context switching currently calls `SelectAccount`, which creates a brand-new session and records `loginMethod = context-switch`.
- As a result, end users can see:
  - their other account-context sessions mixed into the current account security page
  - same-device duplicate-looking sessions such as `email-password` and `context-switch`
  - an internal technical label (`context-switch`) that is not meaningful product language

## 2. Confirmed Product Decisions

- Self-service security center shows only sessions for the current `account`.
- The purpose of that page is “same account across multiple devices / browsers / locations”.
- `context-switch` is not a valid user-facing login method label.
- Admin session management remains unresolved at the exact default UX level, but the recommended backend semantic is:
  - keep a `user`-wide investigation view
  - include `accountId` / account display context in each row
  - support account filtering
- Context switch should not leave two parallel effective end-user sessions visible for what the user perceives as one ongoing login on one device.

## 3. Recommended Design

### 3.1 Self-Service Session Boundary

- Change self-service session list from `findAllByUserId(userId)` semantics to `findAllByAccountId(accountId)` semantics.
- Change self-service “logout other devices” semantics from:
  - “revoke all other sessions of this user”
  to:
  - “revoke all other sessions of this current account”
- Keep “logout current session” unchanged, since it already targets a concrete session id.
- Decide whether “logout all” in self-service should mean:
  - recommended: all sessions of current account
  - not recommended: all sessions of current user across accounts

Recommendation: align all self-service actions to the current account boundary for consistency.

### 3.2 Admin Session Boundary

- Do not regress admin investigations into account-only scope.
- Preserve admin list capability at `user` scope.
- Add explicit returned fields or composed display metadata so admins can distinguish:
  - account id
  - account display name if available from aggregated context
  - tenant / scope level
- Add optional account filter in admin query path later if desired, but keep first implementation minimal if no current UI needs it.

### 3.3 Context Switch Session Behavior

- Preferred behavior: reuse the current session identity and rewrite its account context plus token window.
- If the current session repository abstraction makes in-place account rebinding too invasive, fallback behavior is:
  - create replacement session for the new account
  - revoke/delete the previous current-device session in the same operation
  - ensure the user sees only one effective current-device session after switch

Recommendation: attempt session reuse first only if the repository and JWT model support it with focused changes. Otherwise choose replacement semantics to avoid wide architectural churn.

### 3.4 Login Method Presentation

- Do not expose raw `context-switch` in self-service UI.
- Keep audit/event internals free to record context switching as an implementation detail.
- For session UI:
  - recommended: preserve original login method when a current-device session is rebound/replaced during switch
  - fallback: render a friendly label such as “账号切换后续签” only in admin/internal tooling, not in end-user self-service

Recommendation: in self-service session UI, always show the original interactive login method (`email-password`, `phone-password`, `email-otp`, `phone-otp`) rather than `context-switch`.

## 4. Impacted Areas

### 4.1 auth-service

**Files likely involved:**
- `src/services/system/auth-service/src/domain/repositories/user-session.repository.ts`
- `src/services/system/auth-service/src/infrastructure/repositories/redis/session/redis-user-session.repository.ts`
- `src/services/system/auth-service/src/application/queries/session/list-sessions.handler.ts`
- `src/services/system/auth-service/src/application/commands/auth/logout-other-devices.handler.ts`
- `src/services/system/auth-service/src/application/commands/auth/logout-all.handler.ts`
- `src/services/system/auth-service/src/application/commands/auth/select-account.handler.ts`
- `src/services/system/auth-service/src/domain/aggregates/usersession.aggregate.ts`
- relevant specs under `src/services/system/auth-service/src/**.spec.ts`

**Responsibilities:**
- add account-scoped session query/revoke repository capabilities
- keep admin-side user-scoped capabilities intact
- adjust context-switch semantics
- normalize displayed login method source

### 4.2 auth-bff

**Files likely involved:**
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.ts`
- `src/services/api-gateway/src/modules/auth-bff/application/use-cases/switch-context.use-case.ts`
- `src/services/api-gateway/src/modules/auth-bff/interfaces/http/controllers/auth.controller.ts`
- related specs in the same module

**Responsibilities:**
- pass/consume updated self-service session semantics
- keep admin APIs separate from self-service semantics
- avoid surfacing raw `context-switch` as a user-facing session method label

### 4.3 tenant-web

**Files likely involved:**
- `app/web/apps/tenant-web/src/views/_core/profile/security-center.vue`
- `app/web/apps/tenant-web/src/views/admin/auth-session-management.vue`
- any API response typing under `app/web/apps/tenant-web/src/api/core/user.ts`

**Responsibilities:**
- self-service page assumes current-account scope
- admin page can continue to show broader operator/admin session diagnostics
- session method labels become user-friendly

### 4.4 Contracts / Docs

**Files likely involved:**
- `docs/contracts/auth-service/session.md`
- possibly `docs/contracts/api-gateway/auth-bff-login.md`
- possibly `docs/contracts/api-gateway/access-summary.md` only if account context fields change in display logic
- task/history docs under auth-service if the implementation meaning materially changes

**Responsibilities:**
- document new self-service boundary as `current account`
- preserve admin semantics separately
- clarify context-switch no longer appears as a parallel self-service session

## 5. Non-Goals

- Do not redesign the global session aggregate around account-only identity.
- Do not remove admin user-wide investigations.
- Do not introduce new bounded contexts or new session persistence backends.
- Do not broaden this change into MFA, device inventory, or notification enhancements.

## 6. Risks To Manage

- Redis repository currently indexes heavily by `userId`, so account-scoped queries may need a new index or filtered scan.
- If context switch reuses a session in place, JWT `sid` continuity and refresh-token rotation must remain correct.
- If context switch replaces a session, the replacement path must be atomic enough to avoid a brief dual-session window or accidental logout loops.
- Admin authorization currently depends on tenant-aware session visibility; account-scoping work must not weaken tenant-bound filtering.

## 7. Recommended Implementation Strategy

### Task 1: Lock the desired behavior with failing tests

**Files:**
- Modify: `src/services/system/auth-service/src/application/queries/session/list-sessions.handler.spec.ts` or create adjacent spec if missing
- Modify: `src/services/system/auth-service/src/application/commands/auth/select-account.handler.spec.ts`
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/session-self-service.use-case.spec.ts`
- Modify: `app/web/apps/tenant-web` specs only if present for security-center session rendering

- [ ] **Step 1: Write failing auth-service test for self-service session list to return only current account sessions**
- [ ] **Step 2: Run the focused auth-service test and confirm it fails because current implementation is user-scoped**
- [ ] **Step 3: Write failing auth-service test showing context switch should not leave two visible current-device sessions for one user/account flow**
- [ ] **Step 4: Run the focused select-account/context-switch test and confirm it fails**
- [ ] **Step 5: Write failing auth-bff or UI-level test asserting `context-switch` is not shown as a self-service login method**
- [ ] **Step 6: Run that test and confirm it fails**

### Task 2: Introduce account-scoped repository/query capability

**Files:**
- Modify: `src/services/system/auth-service/src/domain/repositories/user-session.repository.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/redis/session/redis-user-session.repository.ts`
- Modify: `src/services/system/auth-service/src/application/queries/session/list-sessions.handler.ts`
- Test: repository and query-handler specs under `src/services/system/auth-service/src/**`

- [ ] **Step 1: Add repository method(s) for account-scoped session lookup and account-scoped “other device” selection**
- [ ] **Step 2: Implement Redis repository support**
  Recommendation:
  - first pass may filter loaded user sessions by `accountId` if the current data volume is low and this is acceptable for the product stage
  - if that proves too weak, add a dedicated `account_sessions:<accountId>` index
- [ ] **Step 3: Update self-service query handler to use current `accountId` instead of only `userId`**
- [ ] **Step 4: Run focused repository/query tests and confirm they pass**

### Task 3: Align self-service logout semantics to account scope

**Files:**
- Modify: `src/services/system/auth-service/src/application/commands/auth/logout-other-devices.handler.ts`
- Modify: `src/services/system/auth-service/src/application/commands/auth/logout-all.handler.ts`
- Modify: related repository methods/specs

- [ ] **Step 1: Write failing tests proving “other devices” only removes sessions from the same account**
- [ ] **Step 2: Decide and codify whether `logoutAll` is account-scoped or remains user-scoped**
  Recommendation: account-scoped for self-service consistency
- [ ] **Step 3: Implement the minimal handler/repository changes**
- [ ] **Step 4: Run focused command tests and confirm they pass**

### Task 4: Remove duplicate visible sessions caused by context switch

**Files:**
- Modify: `src/services/system/auth-service/src/application/commands/auth/select-account.handler.ts`
- Modify: `src/services/system/auth-service/src/domain/aggregates/usersession.aggregate.ts`
- Modify: `src/services/system/auth-service/src/domain/repositories/user-session.repository.ts`
- Modify: `src/services/system/auth-service/src/infrastructure/repositories/redis/session/redis-user-session.repository.ts`
- Test: select-account and session repository specs

- [ ] **Step 1: Choose implementation mode**
  - preferred if small: reuse current session id and replace account-bound fields plus token window
  - fallback if reuse is invasive: create replacement session and revoke/delete previous current-device session in one command path
- [ ] **Step 2: Implement the smallest safe version**
- [ ] **Step 3: Preserve or derive a friendly user-visible login method instead of `context-switch`**
- [ ] **Step 4: Run focused select-account/session tests and confirm only one current-device self-service session remains visible**

### Task 5: Keep admin session management on the broader investigation path

**Files:**
- Modify: `src/services/system/auth-service/src/application/queries/session/admin-list-user-sessions.handler.ts` only if necessary
- Modify: `src/services/api-gateway/src/modules/auth-bff/application/use-cases/admin-security.use-case.ts` only if necessary
- Modify: `app/web/apps/tenant-web/src/views/admin/auth-session-management.vue` only if UI display needs explicit account context
- Test: admin session list specs

- [ ] **Step 1: Verify existing admin flow still returns user-wide sessions**
- [ ] **Step 2: If needed, add explicit account display fields or composed labels**
- [ ] **Step 3: Ensure tenant-bound admin visibility rules still hold**
- [ ] **Step 4: Run admin session tests and confirm no regression**

### Task 6: Update self-service and admin UI wording

**Files:**
- Modify: `app/web/apps/tenant-web/src/views/_core/profile/security-center.vue`
- Modify: `app/web/apps/tenant-web/src/views/admin/auth-session-management.vue`
- Modify: `app/web/apps/tenant-web/src/api/core/user.ts` if response typing changes

- [ ] **Step 1: Adjust self-service copy to imply “当前账号的登录设备” rather than user-wide session inventory**
- [ ] **Step 2: Replace any raw `context-switch` display with a user-friendly method label or suppress it**
- [ ] **Step 3: If admin UI remains user-wide, make account context visible in the row or detail panel**
- [ ] **Step 4: Run tenant-web typecheck and any relevant tests**

### Task 7: Update contracts and implementation notes

**Files:**
- Modify: `docs/contracts/auth-service/session.md`
- Modify: relevant `docs/contracts/api-gateway/*.md` only if returned fields or semantics change
- Modify: auth-service task/history docs if needed

- [ ] **Step 1: Document that self-service session list is scoped to current account**
- [ ] **Step 2: Document admin list as user-wide investigation view**
- [ ] **Step 3: Document that context-switch is no longer a separately surfaced end-user session method**
- [ ] **Step 4: Re-read docs for consistency with implemented behavior**

### Task 8: Verification and rollout safety

**Files:**
- No new files required; use existing test suites and manual validation notes

- [ ] **Step 1: Run focused auth-service specs for session list, logout, and select-account**
- [ ] **Step 2: Run focused auth-bff specs covering session self-service and switch-context**
- [ ] **Step 3: Run `pnpm --dir app/web --filter @oes/tenant-web typecheck`**
- [ ] **Step 4: Manual verification**
  - login with one user owning multiple accounts
  - switch account on the same device
  - verify self-service page shows only current account sessions
  - verify no duplicate `email-password` + `context-switch` pair appears
  - verify another device/browser under the same account still appears
  - verify admin page can still inspect broader user activity

## 8. Acceptance Criteria

- Self-service session list only shows sessions belonging to the current selected account.
- Self-service “other devices” cleanup only affects the current account’s other sessions.
- Same-device account switching no longer leaves two user-visible parallel sessions for one ongoing login flow.
- End users no longer see raw `context-switch` as a login method.
- Admin session investigation still supports a broader user-wide view.
- Tenant-bound admin visibility rules remain intact.

## 9. Open Decision Carried Forward

- Exact admin default UX remains open:
  - default user-wide list with account context visible
  - or default account-filtered list with optional widen-to-user action

This plan recommends keeping backend capability at user-wide scope first, then deciding UI default separately.

## 10. Suggested Execution Order

1. Tests for self-service boundary and context-switch duplication
2. Repository/query scope changes
3. Self-service logout scope changes
4. Context-switch session rewrite/replacement
5. UI label cleanup
6. Admin verification
7. Contract/doc updates

## 11. Implementation Notes

- The implemented self-service flow derives account scope from `currentSessionId`, then filters or revokes sessions based on the resolved `accountId`.
- The current Redis implementation keeps the change focused by filtering existing user session data for account-scoped self-service semantics instead of introducing a dedicated account-session index.
- `SelectAccount` uses replacement semantics in the current implementation: it creates the new account session, persists it, and deletes the previous current session when the switch originated from `context-switch`.
- For the replaced current-device flow, session metadata preserves the prior interactive login method when available so the self-service page does not surface implementation-facing wording.
