# CRM Source Record Read Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render real CRM source records in the customer detail `来源记录` tab by exposing the existing `CrmSourceRecord` read model through CRM service, gRPC, API Gateway, tenant-web BFF, and UI.

**Architecture:** Keep Phase 1 read-only. `crm-service` remains the owner of `CrmSourceRecord`; API Gateway only maps the gRPC response into tenant-web JSON and enforces `crm.account.read`; tenant-web only loads and displays returned records. Manual source creation and primary-source mutation are deferred to backlog and must not be implemented in this plan.

**Tech Stack:** NestJS, CQRS query handlers, Prisma repository, ts-proto gRPC contracts, API Gateway BFF service/controller, Vue 3, Ant Design Vue, Vitest/Jest.

---

## File Structure

- Modify: `docs/plans/features/crm-source-record-closure.md`
  - Limit the active packet to Phase 1 read closure and point Phase 2 manual management to backlog.
- Modify: `docs/plans/backlog.md`
  - Add one Product Deferred item for manual source management.
- Modify: `src/common/src/contracts/crm_service/crm.proto`
  - Add `ListSourceRecords` RPC and source-record DTO messages to `CustomerQueryService`.
- Generate: `src/common/src/generated/crm_service/crm.ts`
  - Regenerate from proto.
- Create: `src/services/business/crm-service/src/application/queries/list-source-records.query.ts`
  - Carry tenant/account id for a source-record read.
- Create: `src/services/business/crm-service/src/application/queries/list-source-records.handler.ts`
  - Read tenant-scoped source records through `CrmAccountRepository`.
- Modify: `src/services/business/crm-service/src/modules/crm-query.module.ts`
  - Register the new query handler.
- Modify: `src/services/business/crm-service/src/interfaces/grpc/customer-grpc.presenter.ts`
  - Map domain source records to gRPC source-record DTOs.
- Modify: `src/services/business/crm-service/src/interfaces/grpc/customer-query.grpc.controller.ts`
  - Add the `listSourceRecords` method.
- Modify: `src/services/business/crm-service/src/infrastructure/repositories/prisma/prisma-crm-account.repository.ts`
  - Return primary source first, then newest captured records.
- Modify tests:
  - `src/services/business/crm-service/test/l1/crm-p1-query-use-cases.spec.ts`
  - `src/services/business/crm-service/test/l2/prisma-crm-p1.repositories.spec.ts`
  - `src/services/business/crm-service/test/l3/crm-p1-query.grpc.controller.spec.ts`
- Modify: `src/services/api-gateway/src/modules/crm-service/adapters/customer-query-grpc.adapter.ts`
  - Proxy the source-record read RPC.
- Modify: `src/services/api-gateway/src/modules/crm-service/customer-management.service.ts`
  - Add `listSourceRecords`, map raw payload JSON and captured-by display names.
- Modify: `src/services/api-gateway/src/modules/crm-service/interface/http/controllers/customer-management.controller.ts`
  - Add `GET /customer-management/tenants/:tenantId/crm-accounts/:crmAccountId/source-records` with `crm.account.read`.
- Modify tests:
  - `src/services/api-gateway/src/modules/crm-service/customer-management.service.spec.ts`
  - `src/services/api-gateway/src/modules/crm-service/interface/http/controllers/customer-management.controller.spec.ts`
- Modify: `app/web/apps/tenant-web/src/api/bff/customer-management/index.ts`
  - Add source-record types and `listCrmSourceRecordsApi`.
- Modify: `app/web/apps/tenant-web/src/api/bff/customer-management/index.spec.ts`
  - Assert the BFF client path.
- Modify: `app/web/apps/tenant-web/src/views/admin/customer-management-detail.vue`
  - Load and render source records in the tab with loading, error, empty, and list states.
- Modify: `app/web/apps/tenant-web/src/views/admin/customer-management-detail.spec.ts`
  - Assert API loading and record rendering.

## Tasks

### Task 1: Documentation Split

- [x] **Step 1: Restrict the feature packet to Phase 1**

Update `docs/plans/features/crm-source-record-closure.md` so Phase 2 manual management is clearly deferred and no write API shape is frozen in this packet.

- [x] **Step 2: Add Phase 2 to backlog**

Add one `Product Deferred` row to `docs/plans/backlog.md` for manual source creation, primary-source mutation, evidence validation, permission, and audit.

### Task 2: CRM Service Source Record Query

- [ ] **Step 1: Write failing L1 query-handler test**

Add a test that constructs `ListSourceRecordsHandler`, executes it with tenant/account id, and expects the fake repository `listSourceRecords` call plus returned source records.

- [ ] **Step 2: Run L1 test and verify RED**

Run:

```bash
pnpm --filter @oes/crm-service test -- --runInBand test/l1/crm-p1-query-use-cases.spec.ts
```

Expected: fails because `ListSourceRecordsHandler` and query do not exist.

- [ ] **Step 3: Implement query and handler**

Create `list-source-records.query.ts` and `list-source-records.handler.ts`, then register the handler in `crm-query.module.ts`.

- [ ] **Step 4: Run L1 test and verify GREEN**

Run the same L1 command. Expected: source-record query tests pass.

### Task 3: gRPC Read Contract

- [ ] **Step 1: Write failing L3 controller test**

Add a `ListSourceRecords` case to `crm-p1-query.grpc.controller.spec.ts` expecting `ListSourceRecordsQuery` and a gRPC response with primary/newest records.

- [ ] **Step 2: Update proto and regenerate generated types**

Add `CrmSourceRecord`, `ListSourceRecordsRequest`, `ListSourceRecordsResponse`, and `ListSourceRecords` RPC, then run:

```bash
pnpm run proto:format
pnpm run proto:regen
```

- [ ] **Step 3: Implement controller and presenter mapping**

Add `listSourceRecords` to `CustomerQueryGrpcController` and `toListSourceRecordsResponse` to `CustomerGrpcPresenter`.

- [ ] **Step 4: Run L3 query controller test**

Run:

```bash
pnpm --filter @oes/crm-service test -- --runInBand test/l3/crm-p1-query.grpc.controller.spec.ts
```

Expected: all query controller tests pass.

### Task 4: Repository Ordering

- [ ] **Step 1: Write failing L2 ordering assertion**

Extend `prisma-crm-p1.repositories.spec.ts` with multiple source records and expect primary first, then newest `capturedAt` descending.

- [ ] **Step 2: Run L2 test and verify RED**

Run:

```bash
pnpm --filter @oes/crm-service test -- --runInBand test/l2/prisma-crm-p1.repositories.spec.ts
```

Expected: fails while repository still orders by `capturedAt asc`.

- [ ] **Step 3: Implement repository order**

Change `listSourceRecords` to order by `isPrimary desc`, then `capturedAt desc`.

- [ ] **Step 4: Run L2 test and verify GREEN**

Run the same L2 command. Expected: repository tests pass, assuming local integration DB is available.

### Task 5: API Gateway Read Endpoint

- [ ] **Step 1: Write failing gateway service/controller tests**

Add service and controller assertions for `listSourceRecords`, including `crm.account.read` permission metadata and BFF DTO mapping.

- [ ] **Step 2: Implement adapter, service, controller**

Add adapter proxy, service method, source-record mapper, captured-by display-name enrichment, and HTTP route.

- [ ] **Step 3: Run gateway tests**

Run:

```bash
pnpm --filter @oes/api-gateway test -- --runInBand src/modules/crm-service/customer-management.service.spec.ts src/modules/crm-service/interface/http/controllers/customer-management.controller.spec.ts
```

Expected: gateway CRM tests pass.

### Task 6: tenant-web BFF And Detail Tab

- [ ] **Step 1: Write failing API client and detail-page tests**

Assert `listCrmSourceRecordsApi` calls the new endpoint and the detail page loads source records, renders non-empty records, and only shows empty state for empty API results.

- [ ] **Step 2: Implement tenant-web API client**

Add `CrmSourceRecord`, result type, and `listCrmSourceRecordsApi`.

- [ ] **Step 3: Implement detail tab rendering**

Load source records alongside the account detail, render primary badge, source type/name, captured time, captured by, external reference, note, and raw payload summary. Keep Phase 2 actions absent.

- [ ] **Step 4: Run tenant-web tests**

Run:

```bash
pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/customer-management/index.spec.ts apps/tenant-web/src/views/admin/customer-management-detail.spec.ts --dom
```

Expected: tenant-web API and detail tests pass.

### Task 7: Final Verification

- [ ] **Step 1: Run contract lint / generation verification**

Run:

```bash
pnpm run proto:lint
```

- [ ] **Step 2: Run typechecks**

Run:

```bash
pnpm --filter @oes/crm-service typecheck
pnpm --filter @oes/api-gateway typecheck
pnpm --dir app/web --filter @oes/tenant-web typecheck
```

- [ ] **Step 3: Record residual risks**

Note any tests skipped because of local DB availability, and note Hub JSON parsing failure if unresolved.
