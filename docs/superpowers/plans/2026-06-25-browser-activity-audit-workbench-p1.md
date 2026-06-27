# Browser Activity Audit Workbench P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the confirmed browser activity audit workbench for tenant administrators while keeping the existing CRM employee performance console as a CRM analytics page.

**Architecture:** Introduce a dedicated browser activity capability owner instead of attaching visit facts to CRM or generic audit logs. Browser extension writes visit-session summaries through API Gateway, tenant-web reads policy and analytics through API Gateway, and permission-service governs navigation/action visibility.

**Tech Stack:** NestJS services, Prisma, gRPC contracts, API Gateway BFF, Vue 3 tenant-web, Vben conventions, Chrome extension runtime, Vitest, Jest, Playwright.

---

## File Map

- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts` to move the existing CRM performance page under CRM navigation.
- Modify: `src/services/system/permission-service/src/scripts/navigation-foundation.ts` to move existing CRM performance visibility and add browser activity entries/action permissions.
- Modify/Test: `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`.
- Create: `docs/architecture/services/browser-activity-service.md` as the service truth source before implementation.
- Create: `docs/contracts/browser-activity/browser-activity-p1.md` for black-box API and event contracts.
- Create: `src/services/system/browser-activity-service/**` for the dedicated capability owner.
- Modify: `src/common/src/contracts/**` only after contract doc is written; add browser activity proto explicitly.
- Create: `src/services/api-gateway/src/modules/browser-activity-bff/**` for tenant-web and extension BFF endpoints.
- Modify: `app/browser-extension/src/runtime/**` to collect and flush summarized visit sessions.
- Modify: `app/browser-extension/public/manifest.json` only for minimal permissions needed by P1.
- Create: `app/web/apps/tenant-web/src/api/bff/browser-activity/**`.
- Create: `app/web/apps/tenant-web/src/views/admin/browser-activity-audit-workbench.vue`.

## Task 1: Move Existing CRM Performance Console To CRM Navigation

**Files:**
- Modify: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.ts`
- Modify: `src/services/system/permission-service/src/scripts/navigation-foundation.ts`
- Test: `app/web/apps/tenant-web/src/modules/tenant-admin/routes.spec.ts`
- Test: `src/services/system/permission-service/test/l1/navigation-foundation.seed.spec.ts`

- [ ] Write a failing route test that expects `admin.employee-performance-console` under the CRM parent, not the governance/admin parent.
- [ ] Run: `pnpm --dir app/web/apps/tenant-web exec vitest run src/modules/tenant-admin/routes.spec.ts`.
- [ ] Move the route node under the existing CRM navigation parent without renaming the component.
- [ ] Update navigation seed metadata so the entry name/description reads as CRM analytics, not generic employee monitoring.
- [ ] Run: `pnpm --filter permission-service exec jest --config jest.config.js --runInBand test/l1/navigation-foundation.seed.spec.ts`.

## Task 2: Freeze Browser Activity Service Boundary

**Files:**
- Create: `docs/architecture/services/browser-activity-service.md`
- Create: `docs/contracts/browser-activity/browser-activity-p1.md`

- [ ] Write the service truth source from `docs/plans/features/browser-activity-audit-workbench-p1.md`.
- [ ] Explicitly state the service owns tenant activity policy, visit-session summaries, aggregates, and administrator read audit records.
- [ ] Explicitly state it does not own CRM, employee master data, generic audit logs, screenshots, keyboard input, page content, or website classification.
- [ ] Write the P1 contract doc with request/response shapes for policy read/update, extension batch ingest, overview ranking, employee timeline, domain aggregation, and URL search.
- [ ] Review both docs for duplicate truth-source definitions.

## Task 3: Add Browser Activity Service Persistence And Application Core

**Files:**
- Create: `src/services/system/browser-activity-service/prisma/schema.prisma`
- Create: `src/services/system/browser-activity-service/src/domain/**`
- Create: `src/services/system/browser-activity-service/src/application/**`
- Create tests under: `src/services/system/browser-activity-service/test/l1/**`

- [ ] Write failing unit tests for policy defaults: disabled by default, raw retention 90 days, aggregate retention 365 days.
- [ ] Write failing unit tests for visit summary validation: tenant/account/url/domain/start/end/duration fields required, no raw input payload accepted.
- [ ] Write failing unit tests for active/idle metric normalization using the frozen 5-minute active window and 30-second URL merge rule.
- [ ] Implement domain value objects and application handlers with summary comments on every class/function.
- [ ] Run: `pnpm --filter browser-activity-service exec jest --runInBand test/l1`.

## Task 4: Add Browser Activity Service gRPC Interface

**Files:**
- Modify/Create: `src/common/src/contracts/browser_activity_service/browser_activity.proto`
- Create: `src/services/system/browser-activity-service/src/interfaces/grpc/**`
- Create tests under: `src/services/system/browser-activity-service/test/l3/**`

- [ ] Write failing controller tests for policy read/update, ingest, overview, employee timeline, domain aggregation, and URL search.
- [ ] Add explicit tenant/operator/trace/audit context fields to write and sensitive-read calls.
- [ ] Generate contracts using the repo's existing proto generation command.
- [ ] Implement gRPC controller and presenter mappings.
- [ ] Run browser-activity-service L3 tests and service build.

## Task 5: Add API Gateway Browser Activity BFF

**Files:**
- Create: `src/services/api-gateway/src/modules/browser-activity-bff/**`
- Modify: `src/services/api-gateway/src/app.module.ts` or existing module registry if required.
- Create tests under: `src/services/api-gateway/src/modules/browser-activity-bff/**`

- [ ] Write failing controller tests for tenant-web admin endpoints and extension ingest endpoint.
- [ ] Enforce terminal boundary: extension ingest requires `source.user.terminal === 'BROWSER_EXTENSION'`.
- [ ] Enforce tenant context and reject system-scope reads without explicit tenant handling.
- [ ] Build audit context for policy updates and sensitive reads.
- [ ] Run: `pnpm --filter api-gateway exec jest --runInBand src/modules/browser-activity-bff`.

## Task 6: Add Permission And Navigation Entries

**Files:**
- Modify: `src/services/system/permission-service/src/scripts/permission-catalog.ts`
- Modify: `src/services/system/permission-service/src/scripts/navigation-foundation.ts`
- Modify tests under: `src/services/system/permission-service/test/l1/**`

- [ ] Add action codes for policy read/manage, overview read, employee detail read, and URL detail read.
- [ ] Add tenant-web navigation entry `browser-activity.audit-workbench`.
- [ ] Assign P1 visibility to `tenant.admin` only unless a more specific role already exists.
- [ ] Run permission seed validation tests.

## Task 7: Add Browser Extension Visit Session Collection

**Files:**
- Modify: `app/browser-extension/public/manifest.json`
- Create: `app/browser-extension/src/runtime/browser-activity-collector.ts`
- Create: `app/browser-extension/src/runtime/browser-activity-flush.ts`
- Create tests under: `app/browser-extension/src/runtime/**.spec.ts`

- [ ] Write failing tests for no collection when policy disabled.
- [ ] Write failing tests for active/idle accounting with visibility/focus/user-activity events.
- [ ] Write failing tests for same-URL 30-second merge.
- [ ] Write failing tests proving keyboard content is never stored, only the presence of activity.
- [ ] Implement collection as local visit-session summaries, not raw event streams.
- [ ] Run: `pnpm --dir app/browser-extension test` or the repo's extension test command.

## Task 8: Add Tenant-Web Browser Activity API Client And Page

**Files:**
- Create: `app/web/apps/tenant-web/src/api/bff/browser-activity/index.ts`
- Create: `app/web/apps/tenant-web/src/views/admin/browser-activity-audit-workbench.vue`
- Create tests beside both files.

- [ ] Write failing API client tests for all BFF endpoints.
- [ ] Write failing page tests for ranking, employee switch, domain drilldown, URL search, timeline, disabled policy empty state, and permission-denied state.
- [ ] Implement a restrained analytics workbench aligned with Vben and the existing `/analytics` visual language.
- [ ] Keep cards shallow, avoid nested cards, avoid CRM language, and label metrics as facts rather than conclusions.
- [ ] Run tenant-web unit tests, typecheck, and build.

## Task 9: Real Browser Verification

**Files:**
- Add or update Playwright smoke script if the repo has a matching local browser-test pattern.

- [ ] Start the local dev server on an available port.
- [ ] Verify CRM performance console appears under CRM navigation.
- [ ] Verify Browser Activity Audit Workbench appears under its own non-CRM navigation entry.
- [ ] Verify desktop and mobile layouts have no overlapping text.
- [ ] Verify ranking, employee switch, domain drilldown, URL search, and timeline controls trigger the expected BFF calls.
- [ ] Capture screenshots for delivery notes.

## Self-Review

- Spec coverage: covers CRM page relocation, dedicated owner, policy, ingest, metrics, permissions, audit, extension collection, tenant-web analysis, and browser verification.
- Placeholder scan: no P1 task depends on deferred or undefined behavior.
- Type consistency: plan consistently uses browser activity, visit session summaries, and `browser-activity.audit-workbench`.
