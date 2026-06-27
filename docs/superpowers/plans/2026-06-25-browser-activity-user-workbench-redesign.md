# Browser Activity User Workbench Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the browser activity workbench as a single-user browser extension monitoring console with disabled configuration state, enabled aggregate blocks, and ranking drilldown drawers.

**Architecture:** Keep browser-activity-service as the owner of visit facts and employee collection grants. Extend the existing string period contract to support `LAST_1_HOUR`, `LAST_1_DAY`, `LAST_1_WEEK`, and `LAST_1_MONTH`; tenant-web derives URL ranking and drilldown views from the selected employee timeline without adding new backend ownership.

**Tech Stack:** NestJS BFF/service, gRPC string period contract, Prisma read model, Vue 3 tenant-web, Vben/Ant Design Vue styling conventions, Vitest/Jest.

---

### Task 1: Period Contract

**Files:**
- Modify: `src/services/system/browser-activity-service/src/application/browser-activity-application.ts`
- Modify: `src/services/system/browser-activity-service/src/infrastructure/prisma/prisma-browser-activity-application.ts`
- Modify: `src/services/system/browser-activity-service/src/interfaces/grpc/browser-activity.grpc.controller.ts`
- Modify: `src/services/api-gateway/src/modules/browser-activity-bff/browser-activity-bff.service.ts`
- Modify: `src/services/api-gateway/src/modules/browser-activity-bff/interfaces/http/dtos/browser-activity.dto.ts`
- Modify: `app/web/apps/tenant-web/src/api/bff/browser-activity/index.ts`
- Test: related L1/L2/L3/BFF/API specs

- [ ] Add failing tests proving `LAST_1_HOUR`, `LAST_1_DAY`, `LAST_1_WEEK`, and `LAST_1_MONTH` are accepted and forwarded.
- [ ] Implement period normalization and filtering in memory and Prisma read models.
- [ ] Run service, BFF, and tenant-web API tests.

### Task 2: Single-User UI State

**Files:**
- Modify: `app/web/apps/tenant-web/src/views/admin/browser-activity-audit-workbench.vue`
- Test: `app/web/apps/tenant-web/src/views/admin/browser-activity-audit-workbench.spec.ts`

- [ ] Add failing tests for default `LAST_1_DAY`, user selector refresh, disabled monitoring state, BE-login-disabled toggle guard, and absence of global tenant metrics.
- [ ] Rebuild the page shell around selected employee context and monitor toggle.
- [ ] Hide all activity blocks when selected employee monitoring is disabled.

### Task 3: Aggregate Blocks And Drilldown

**Files:**
- Modify: `app/web/apps/tenant-web/src/views/admin/browser-activity-audit-workbench.vue`
- Test: `app/web/apps/tenant-web/src/views/admin/browser-activity-audit-workbench.spec.ts`

- [ ] Add failing tests for Domain duration ranking, URL duration ranking, time distribution, active composition, and right-side drilldown drawer.
- [ ] Implement URL aggregation from selected employee timeline visits.
- [ ] Implement domain and URL drilldown drawers without adding a new backend endpoint.

### Task 4: Verification And Cleanup

**Files:**
- Modify: `scripts/local/browser-activity-ui-smoke.mjs`
- Possibly run: existing live smoke cleanup/reset path

- [ ] Update UI smoke expectations to the new labels and single-user layout.
- [ ] Run frontend unit tests, typecheck, build, and smoke.
- [ ] Run backend/BFF tests, typecheck/build, and live smoke.
- [ ] Clear test database data created by browser activity smoke before final handoff.
