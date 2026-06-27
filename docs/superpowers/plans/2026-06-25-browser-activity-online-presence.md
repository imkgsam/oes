# Browser Activity Online Presence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add heartbeat-derived online presence to Browser Activity Audit Workbench so tenant administrators can see which employees' browser-extension collection channel is online.

**Architecture:** `browser-activity-service` remains the owner of heartbeat facts and online presence read models. API Gateway BFF exposes a tenant-web `/browser-activity/online-presence` endpoint and maps trusted session context; tenant-web renders online/stale/offline state in the existing audit workbench. Browser extension heartbeat behavior remains gated by authenticated `BROWSER_EXTENSION` session.

**Tech Stack:** NestJS, gRPC/proto, Prisma, Vue 3, Vitest, Jest, Playwright smoke scripts.

---

### Task 1: Service Application Presence Model

**Files:**
- Modify: `src/services/system/browser-activity-service/src/application/browser-activity-application.ts`
- Modify: `src/services/system/browser-activity-service/test/l1/browser-activity-application.spec.ts`

- [ ] **Step 1: Write failing tests**
  - Add tests proving WEB heartbeat is rejected, extension heartbeat creates `ONLINE`, 91-second old heartbeat is `STALE`, 181-second old heartbeat is `OFFLINE`, and overview employees include online status.

- [ ] **Step 2: Verify red**
  - Run: `pnpm --filter browser-activity-service exec jest --config jest.config.js --runInBand test/l1/browser-activity-application.spec.ts`
  - Expected: failures for missing `getOnlinePresence`, missing `onlineStatus`, and missing threshold counts.

- [ ] **Step 3: Implement minimal service application**
  - Add `BrowserActivityOnlineStatus`, presence interfaces, threshold constants, in-memory presence map, `getOnlinePresence`, overview presence enrichment, and heartbeat presence upsert.

- [ ] **Step 4: Verify green**
  - Run the same Jest command and confirm the L1 suite passes.

### Task 2: Prisma Persistence and gRPC Contract

**Files:**
- Modify: `src/common/src/contracts/browser_activity_service/browser_activity.proto`
- Modify: `src/services/system/browser-activity-service/prisma/schema.prisma`
- Modify: `src/services/system/browser-activity-service/src/infrastructure/prisma/prisma-browser-activity-application.ts`
- Modify: `src/services/system/browser-activity-service/src/interfaces/grpc/browser-activity.grpc.controller.ts`
- Modify: `src/services/system/browser-activity-service/test/l2/prisma-browser-activity-application.spec.ts`
- Modify: `src/services/system/browser-activity-service/test/l3/browser-activity.grpc.controller.spec.ts`

- [ ] **Step 1: Write failing adapter/controller tests**
  - Add L2/L3 assertions for presence upsert, status thresholds, and gRPC `GetOnlinePresence`.

- [ ] **Step 2: Verify red**
  - Run focused L2/L3 Jest tests and confirm missing method/proto/schema failures.

- [ ] **Step 3: Implement schema/proto/controller/persistence**
  - Add `BrowserActivityOnlinePresence` Prisma model.
  - Add `GetOnlinePresence` RPC and response messages.
  - Update generated common contract via `pnpm proto:gen`.
  - Implement Prisma presence upsert and reads.

- [ ] **Step 4: Verify green**
  - Run service L1/L2/L3 tests and `pnpm --filter browser-activity-service build`.

### Task 3: API Gateway BFF Endpoint

**Files:**
- Modify: `src/services/api-gateway/src/modules/browser-activity-bff/browser-activity-bff.service.ts`
- Modify: `src/services/api-gateway/src/modules/browser-activity-bff/adapters/browser-activity-grpc.adapter.ts`
- Modify: `src/services/api-gateway/src/modules/browser-activity-bff/interfaces/http/controllers/browser-activity.controller.ts`
- Modify: `src/services/api-gateway/src/modules/browser-activity-bff/interfaces/http/controllers/browser-activity.controller.spec.ts`
- Modify: `src/services/api-gateway/src/modules/browser-activity-bff/browser-activity-bff.service.spec.ts`

- [ ] **Step 1: Write failing BFF tests**
  - Add assertions that `/online-presence` uses `browser_activity.overview.read`, trusted WEB tenant context, and forwards `status` / `includeOfflineWithinMinutes`.

- [ ] **Step 2: Verify red**
  - Run: `pnpm --filter api-gateway exec jest --runInBand src/modules/browser-activity-bff`

- [ ] **Step 3: Implement minimal BFF endpoint**
  - Add client port method, service method, gRPC adapter method, controller route, and query normalization.

- [ ] **Step 4: Verify green**
  - Run BFF Jest suite and `pnpm --filter api-gateway build`.

### Task 4: Tenant-Web API and UI

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/browser-activity/index.ts`
- Modify: `app/web/apps/tenant-web/src/api/bff/browser-activity/index.spec.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/browser-activity-audit-workbench.vue`
- Modify: `app/web/apps/tenant-web/src/views/admin/browser-activity-audit-workbench.spec.ts`

- [ ] **Step 1: Write failing frontend tests**
  - API test expects `getBrowserActivityOnlinePresenceApi`.
  - Page test expects online/stale/offline counts, employee status dots, last heartbeat copy, and no performance/violation wording.

- [ ] **Step 2: Verify red**
  - Run tenant-web focused Vitest command.

- [ ] **Step 3: Implement API and UI**
  - Add online presence types/API.
  - Load presence with overview.
  - Merge presence into employee cards.
  - Add top metrics and selected employee presence details.

- [ ] **Step 4: Verify green**
  - Run tenant-web focused Vitest, typecheck, and build.

### Task 5: Live Smokes and Final Verification

**Files:**
- Modify: `scripts/local/browser-activity-live-smoke.mjs`
- Modify: `scripts/local/browser-activity-ui-smoke.mjs`

- [ ] **Step 1: Extend smoke assertions**
  - Live smoke verifies extension token heartbeat creates online presence and WEB token cannot ingest heartbeat.
  - UI smoke verifies online metric/status appears on desktop and mobile.

- [ ] **Step 2: Run full verification**
  - Extension tests/typecheck/build.
  - Browser activity service tests/build.
  - API Gateway BFF tests/build.
  - Tenant-web tests/typecheck/build.
  - Live API smoke and Playwright UI smoke.
