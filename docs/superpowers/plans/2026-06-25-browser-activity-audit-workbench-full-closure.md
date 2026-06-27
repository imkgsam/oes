# Browser Activity Audit Workbench Full Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully implement Browser Activity Audit Workbench Task 2 so browser activity is recorded only after extension login and is queryable from tenant-web through real backend facts.

**Architecture:** `browser-activity-service` owns policy, visit summaries, heartbeat, read models, and sensitive-read audit facts. API Gateway exposes authenticated `/extension/browser-activity/*` ingest endpoints and `/browser-activity/*` tenant-web admin endpoints. The browser extension starts collectors only from an authenticated extension session and never buffers unauthenticated browsing history.

**Tech Stack:** NestJS, Prisma, Jest, API Gateway BFF, Vue 3 tenant-web, Vben, Chrome Extension runtime, Vitest, Playwright.

---

## File Map

- Create: `src/services/system/browser-activity-service/package.json`
- Create: `src/services/system/browser-activity-service/jest.config.js`
- Create: `src/services/system/browser-activity-service/tsconfig.json`
- Create: `src/services/system/browser-activity-service/tsconfig.spec.json`
- Create: `src/services/system/browser-activity-service/prisma/schema.prisma`
- Create: `src/services/system/browser-activity-service/src/**`
- Create: `src/services/system/browser-activity-service/test/**`
- Create or modify: `src/common/src/contracts/browser_activity_service/**`
- Create: `src/services/api-gateway/src/modules/browser-activity-bff/**`
- Modify: `src/services/api-gateway/src/app.module.ts`
- Modify: `app/browser-extension/src/auth/auth-session.ts`
- Create: `app/browser-extension/src/runtime/browser-activity-api.ts`
- Create: `app/browser-extension/src/runtime/browser-activity-collector.ts`
- Create: `app/browser-extension/src/runtime/browser-activity-runtime.ts`
- Create tests beside extension runtime files.
- Modify: `app/web/apps/tenant-web/src/api/bff/browser-activity/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/browser-activity-audit-workbench.vue`
- Modify: permission-service seed files already introduced by the UI slice as needed.

## Task 1: Extension Login Gate Contract

**Files:**
- Test: `app/browser-extension/src/runtime/browser-activity-runtime.spec.ts`
- Create: `app/browser-extension/src/runtime/browser-activity-runtime.ts`

- [ ] **Step 1: Write failing tests**

```ts
it('does not start collection when extension auth storage has no session', async () => {
  const collector = { start: vi.fn(), stop: vi.fn(), flush: vi.fn() }
  const storage = new MemoryAuthStorage()
  const runtime = new BrowserActivityRuntime({ collector, storage })

  await runtime.restore()

  expect(collector.start).not.toHaveBeenCalled()
  expect(collector.flush).not.toHaveBeenCalled()
})

it('starts collection only after authenticated BROWSER_EXTENSION session restore', async () => {
  const collector = { start: vi.fn(), stop: vi.fn(), flush: vi.fn() }
  const storage = new MemoryAuthStorage()
  await storage.save({
    accessToken: 'access-1',
    refreshToken: 'refresh-1',
    context: { terminal: 'BROWSER_EXTENSION', tenant: { tenantId: 'tenant-1' }, account: { accountId: 'account-1' } } as any
  })
  const runtime = new BrowserActivityRuntime({ collector, storage })

  await runtime.restore()

  expect(collector.start).toHaveBeenCalledWith(expect.objectContaining({
    accessToken: 'access-1',
    accountId: 'account-1',
    tenantId: 'tenant-1'
  }))
})

it('stops collection and discards pending unauthenticated state on logout', async () => {
  const collector = { start: vi.fn(), stop: vi.fn(), flush: vi.fn(), discard: vi.fn() }
  const storage = new MemoryAuthStorage()
  const runtime = new BrowserActivityRuntime({ collector, storage })

  await runtime.logout()

  expect(collector.stop).toHaveBeenCalled()
  expect(collector.discard).toHaveBeenCalled()
  expect(collector.flush).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --dir app/browser-extension exec vitest run src/runtime/browser-activity-runtime.spec.ts --dom
```

Expected: fails because `BrowserActivityRuntime` does not exist.

- [ ] **Step 3: Implement runtime gate**

Create `BrowserActivityRuntime` with `restore()`, `startFromSession(session)`, `logout()`, and `stop()` methods. The implementation must require `context.terminal === 'BROWSER_EXTENSION'`, `tenant.tenantId`, `account.accountId`, and `accessToken` before calling `collector.start`.

- [ ] **Step 4: Verify GREEN**

Run the same Vitest command. Expected: all tests in the file pass.

## Task 2: Extension Visit Summary Collector

**Files:**
- Test: `app/browser-extension/src/runtime/browser-activity-collector.spec.ts`
- Create: `app/browser-extension/src/runtime/browser-activity-collector.ts`

- [ ] **Step 1: Write failing tests for no raw data and metrics**

```ts
it('summarizes URL visits without storing keyboard content or page body', () => {
  const collector = new BrowserActivityCollector({ now: scriptedClock([0, 60_000, 120_000]) })
  collector.startVisit({ tabId: 1, url: 'https://supplier.example/orders', title: 'Orders' })
  collector.recordUserActivity({ kind: 'keyboard', occurredAtMs: 60_000 })
  collector.endVisit({ tabId: 1, occurredAtMs: 120_000 })

  const [summary] = collector.drain()

  expect(JSON.stringify(summary)).not.toContain('keyboard')
  expect(JSON.stringify(summary)).not.toContain('pageBody')
  expect(summary.domain).toBe('supplier.example')
  expect(summary.dwellDurationSeconds).toBe(120)
})

it('never drains unauthenticated history before startAuthenticatedSession', () => {
  const collector = new BrowserActivityCollector({ now: scriptedClock([0, 10_000]) })
  collector.startVisit({ tabId: 1, url: 'https://supplier.example', title: 'Supplier' })

  expect(collector.drain()).toEqual([])
})
```

- [ ] **Step 2: Verify RED**

Run:

```bash
pnpm --dir app/browser-extension exec vitest run src/runtime/browser-activity-collector.spec.ts --dom
```

Expected: fails because collector does not exist.

- [ ] **Step 3: Implement collector**

Implement authenticated-session state, URL/domain parsing, 5-minute active window, 30-second same-URL merge, foreground/active/idle counters, `drain()`, and `discard()`.

- [ ] **Step 4: Verify GREEN**

Run the same Vitest command. Expected: all collector tests pass.

## Task 3: Browser Activity Service Domain And Application Core

**Files:**
- Create: `src/services/system/browser-activity-service/test/l1/browser-activity-policy.spec.ts`
- Create: `src/services/system/browser-activity-service/test/l1/visit-session-ingest.spec.ts`
- Create: `src/services/system/browser-activity-service/src/domain/**`
- Create: `src/services/system/browser-activity-service/src/application/**`
- Create: `src/services/system/browser-activity-service/src/infrastructure/repositories/in-memory/**`

- [ ] **Step 1: Write failing policy tests**

```ts
it('defaults tenant policy to disabled with P1 retention defaults', async () => {
  const service = createInMemoryBrowserActivityApplication()

  await expect(service.getPolicy({ tenantId: 'tenant-1' })).resolves.toEqual({
    enabled: false,
    rawRetentionDays: 90,
    aggregateRetentionDays: 365
  })
})
```

- [ ] **Step 2: Write failing ingest gate tests**

```ts
it('rejects visit sessions when the extension context is missing', async () => {
  const service = createInMemoryBrowserActivityApplication()

  await expect(service.appendVisitSessions({
    tenantId: 'tenant-1',
    operator: { accountId: 'account-1', terminal: 'WEB' },
    sessions: [validVisitSession()]
  })).rejects.toThrow('BROWSER_EXTENSION terminal is required')
})

it('rejects visit sessions while tenant policy is disabled', async () => {
  const service = createInMemoryBrowserActivityApplication()

  await expect(service.appendVisitSessions({
    tenantId: 'tenant-1',
    operator: { accountId: 'account-1', terminal: 'BROWSER_EXTENSION' },
    sessions: [validVisitSession()]
  })).rejects.toThrow('Browser activity policy is disabled')
})
```

- [ ] **Step 3: Verify RED**

Run:

```bash
pnpm --filter browser-activity-service exec jest --config jest.config.js --runInBand test/l1
```

Expected: fails because service package and application factory do not exist.

- [ ] **Step 4: Implement service package and in-memory application core**

Create the service skeleton, entities, repositories, validation errors, policy service, ingest service, query service, and in-memory repositories. Every class/function gets a concise summary comment.

- [ ] **Step 5: Verify GREEN**

Run the same Jest command. Expected: L1 tests pass.

## Task 4: Browser Activity Service Persistence And gRPC Surface

**Files:**
- Create: `src/services/system/browser-activity-service/prisma/schema.prisma`
- Create: `src/services/system/browser-activity-service/src/infrastructure/repositories/prisma/**`
- Create: `src/services/system/browser-activity-service/src/interfaces/grpc/**`
- Create: `src/services/system/browser-activity-service/test/l2/**`
- Create: `src/services/system/browser-activity-service/test/l3/**`

- [ ] **Step 1: Write failing Prisma repository tests for policy and visit upsert**
- [ ] **Step 2: Write failing gRPC controller tests for policy, ingest, heartbeat, overview, timeline, domain aggregation, URL search**
- [ ] **Step 3: Add Prisma schema with policy, visit session, heartbeat, read audit, and aggregate support tables**
- [ ] **Step 4: Implement Prisma repositories and gRPC controller/presenter mappings**
- [ ] **Step 5: Run**

```bash
pnpm --filter browser-activity-service exec jest --config jest.config.js --runInBand test/l2 test/l3
pnpm --filter browser-activity-service build
```

Expected: tests and build pass.

## Task 5: API Gateway Browser Activity BFF

**Files:**
- Create: `src/services/api-gateway/src/modules/browser-activity-bff/browser-activity-bff.module.ts`
- Create: `src/services/api-gateway/src/modules/browser-activity-bff/browser-activity-bff.service.ts`
- Create: `src/services/api-gateway/src/modules/browser-activity-bff/interfaces/http/controllers/browser-activity.controller.ts`
- Create: `src/services/api-gateway/src/modules/browser-activity-bff/interfaces/http/dtos/browser-activity.dto.ts`
- Create tests beside service/controller.
- Modify: `src/services/api-gateway/src/app.module.ts`

- [ ] **Step 1: Write failing BFF service tests**

Tests must assert extension ingest rejects non-`BROWSER_EXTENSION` source, ignores client-supplied tenant/operator fields, forwards trusted source context, and admin URL search requires URL detail permission.

- [ ] **Step 2: Verify RED**

```bash
pnpm --filter api-gateway exec jest --runInBand src/modules/browser-activity-bff
```

- [ ] **Step 3: Implement BFF module**

Use existing downstream source mapping and permission access patterns from extension CRM/auth BFF modules. Do not persist facts in API Gateway.

- [ ] **Step 4: Verify GREEN**

Run the same Jest command and `pnpm --filter api-gateway build`.

## Task 6: Tenant-Web Real Backend Binding

**Files:**
- Modify: `app/web/apps/tenant-web/src/api/bff/browser-activity/index.ts`
- Modify: `app/web/apps/tenant-web/src/views/admin/browser-activity-audit-workbench.vue`
- Modify tests beside both files.

- [ ] **Step 1: Write failing tests proving the page renders backend facts when API succeeds and shows preview only on BFF unavailability**
- [ ] **Step 2: Remove any production dependency on preview data for successful API paths**
- [ ] **Step 3: Keep explicit local preview notice only for local 404/unavailable BFF**
- [ ] **Step 4: Run**

```bash
pnpm --dir app/web/apps/tenant-web exec vitest run src/api/bff/browser-activity/index.spec.ts src/views/admin/browser-activity-audit-workbench.spec.ts src/modules/tenant-admin/routes.spec.ts
pnpm --dir app/web/apps/tenant-web typecheck
```

Expected: tests and typecheck pass.

## Task 7: Permission And Seed Verification

**Files:**
- Modify if needed: `src/services/system/permission-service/src/scripts/permission-catalog.ts`
- Modify if needed: `src/services/system/permission-service/src/scripts/navigation-foundation.ts`
- Modify tests under: `src/services/system/permission-service/test/l1/**`

- [ ] **Step 1: Ensure browser activity action codes and navigation entry remain tenant-admin visible**
- [ ] **Step 2: Run**

```bash
pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/navigation-foundation.seed.spec.ts test/l1/permission-service-seed.spec.ts
pnpm --filter permission-service seed:apply -- --apply
```

Expected: tests pass and seed validation has `validationErrors: []`.

## Task 8: End-To-End Verification

**Files:**
- Use local scripts or inline Playwright smoke script.

- [ ] **Step 1: Run all focused unit/integration tests from Tasks 1-7**
- [ ] **Step 2: Build browser extension, tenant-web, API Gateway, and browser-activity-service**
- [ ] **Step 3: Start local services needed for tenant-web**
- [ ] **Step 4: Verify with Playwright**

Required browser checks:

- login as `csp@ml.lc`
- select tenant account
- open `/admin/browser-activity-audit-workbench`
- verify real BFF-backed facts when backend is available
- verify employee switch, domain selection, URL search
- verify desktop and mobile no horizontal overflow
- verify no page copy contains “绩效” or “摸鱼”

- [ ] **Step 5: Extension runtime verification**

Required extension checks:

- unauthenticated extension storage does not start collector and sends no ingest requests
- authenticated extension session starts collector
- logout stops collector and discards pending state
- policy disabled response stops ingest without buffering unauthenticated history

## Completion Gate

Do not mark the goal complete until all of the following evidence exists:

- Browser extension tests prove no unauthenticated collection or upload.
- Browser activity service tests prove disabled-by-default policy and terminal-gated ingest.
- API Gateway tests prove trusted session context is used and client terminal/tenant claims are ignored.
- Tenant-web tests and Playwright prove the admin page renders real backend facts.
- Permission seed validation passes with no errors.
- Focused builds/typechecks pass.
