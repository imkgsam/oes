# CRM Archive Reason Lead / PC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement CRM-owned archive reason for Lead and Prospect Customer, then expose it through BFF and browser extension tags without plugin-side business judgment.

**Architecture:** `crm-service` owns archive semantics and persistence. API Gateway maps the CRM account shape and command endpoint while reusing existing `crm.account.manage`. Browser extension renders only tag data returned by the BFF and omits CRM misses from Google result pages.

**Tech Stack:** NestJS, CQRS, gRPC/ts-proto, Prisma, Jest, Vue/Vitest browser extension runtime.

---

## Ownership Gate

Do not start implementation until Hub claims succeed for:

- `docs/architecture/services/crm-service.md`
- `docs/contracts/api-gateway/extension-crm-workspace.md`
- `src/services/business/crm-service/**`
- `src/common/src/contracts/crm_service/**`
- `src/services/api-gateway/src/modules/crm-service/**`
- `app/browser-extension/**`

Current blocker was reported by thread `crm-archive-reason-lead-pc` on `2026-06-23`.

## File Map

- `docs/architecture/services/crm-service.md`: stable CRM service truth source for archive rules.
- `docs/contracts/api-gateway/extension-crm-workspace.md`: extension BFF contract field and tag behavior.
- `src/services/business/crm-service/src/domain/models/crm-records.ts`: `CrmArchiveReason` enum and account field.
- `src/services/business/crm-service/src/application/commands/archive-crm-account.command.ts`: archive command input.
- `src/services/business/crm-service/src/application/commands/archive-crm-account.handler.ts`: archive use case validation and mutation.
- `src/services/business/crm-service/src/modules/crm-management.module.ts`: command handler registration.
- `src/services/business/crm-service/prisma/schema.prisma`: nullable archive reason persistence.
- `src/services/business/crm-service/src/infrastructure/repositories/prisma/prisma-crm-account.repository.ts`: save/load archive reason.
- `src/common/src/contracts/crm_service/crm.proto`: gRPC command and account field.
- `src/services/business/crm-service/src/interfaces/grpc/customer-management.grpc.controller.ts`: archive RPC command mapping and audit.
- `src/services/business/crm-service/src/interfaces/grpc/customer-grpc.presenter.ts`: account payload archive reason.
- `src/services/api-gateway/src/modules/crm-service/customer-management.service.ts`: BFF account mapping and archive method.
- `src/services/api-gateway/src/modules/crm-service/adapters/customer-management-grpc.adapter.ts`: archive RPC adapter.
- `src/services/api-gateway/src/modules/crm-service/interface/http/controllers/customer-management.controller.ts`: BFF archive endpoint.
- `src/services/api-gateway/src/modules/crm-service/interface/http/dtos/customer-management.dto.ts`: archive request DTO.
- `src/services/api-gateway/src/modules/crm-service/extension-crm-workspace.service.ts`: search result behavior for existing archived CRM records and no CRM miss tags.
- `app/browser-extension/src/side-panel/crm-types.ts`: extension-safe archive reason fields.
- `app/browser-extension/src/runtime/crm-page-annotations.ts`: separated tag rendering.
- Test files adjacent to each affected layer.

## Task 1: Freeze Stable Docs

- [ ] Update `docs/architecture/services/crm-service.md` section `Core Object Semantics` to include `archiveReason` after `archivedAt`.
- [ ] Replace section `Archive Rules` with the Lead / Prospect Customer archive rules from `docs/plans/features/crm-archive-reason-lead-pc.md`.
- [ ] Update `docs/contracts/api-gateway/extension-crm-workspace.md` to include `archiveReason` in CRM account summaries and Google result tag behavior.
- [ ] Run `rg -n "Archive reason / restore reason|CRM 未建档|CRM 我的 Lead" docs/architecture/services/crm-service.md docs/contracts/api-gateway/extension-crm-workspace.md` and confirm the obsolete rules are gone or explicitly marked out of scope.

## Task 2: CRM Service L1 Tests

- [ ] Add failing tests to `src/services/business/crm-service/test/l1/crm-p1-lead-use-cases.spec.ts`.
- [ ] Test `ArchiveCrmAccount / should archive active Lead with required reason`.
- [ ] Test `ArchiveCrmAccount / should archive active Prospect Customer with required reason`.
- [ ] Test `ArchiveCrmAccount / should reject Customer archive`.
- [ ] Run `pnpm --filter crm-service test:l1 -- --runTestsByPath test/l1/crm-p1-lead-use-cases.spec.ts` and confirm failure is caused by missing archive command/enum.

## Task 3: CRM Domain And Application

- [ ] Add `CrmArchiveReason` enum to `crm-records.ts`.
- [ ] Add optional `archiveReason?: CrmArchiveReason | null` to `CrmAccountRecord`.
- [ ] Create `archive-crm-account.command.ts` with tenant id, CRM account id, operator account id, and `archiveReason`.
- [ ] Create `archive-crm-account.handler.ts` with validation for active Lead / Prospect Customer only.
- [ ] Register `ArchiveCrmAccountHandler` in `crm-management.module.ts`.
- [ ] Run the L1 command from Task 2 and confirm the new tests pass.

## Task 4: CRM Persistence Tests

- [ ] Add failing L2 coverage in `src/services/business/crm-service/test/l2/prisma-crm-p1.repositories.spec.ts` proving `archiveReason` round-trips.
- [ ] Run `pnpm --filter crm-service test:l2 -- --runTestsByPath test/l2/prisma-crm-p1.repositories.spec.ts` and confirm failure is caused by missing schema/persistence.
- [ ] Add Prisma enum `CrmArchiveReason` and nullable field `archiveReason CrmArchiveReason?`.
- [ ] Update Prisma repository create/update/read mappings.
- [ ] Run `pnpm --filter crm-service prisma:generate`.
- [ ] Run the L2 command again and confirm the test passes.

## Task 5: CRM gRPC Contract

- [ ] Add `string archive_reason = 24` to `CrmAccountP1`.
- [ ] Add `ArchiveCrmAccount` RPC, request, and response messages.
- [ ] Run `pnpm proto:format`.
- [ ] Run `pnpm proto:gen`.
- [ ] Add CRM L3 controller test coverage for archive command mapping and response.
- [ ] Implement archive RPC in `CustomerManagementGrpcController`.
- [ ] Update `CustomerGrpcPresenter.toCrmAccountP1`.
- [ ] Run `pnpm --filter crm-service test:l3 -- --runTestsByPath test/l3/crm-p1-management.grpc.controller.spec.ts`.

## Task 6: API Gateway / BFF Tests And Implementation

- [ ] Add failing service/controller tests for archive mapping in `src/services/api-gateway/src/modules/crm-service/customer-management.service.spec.ts` and `interface/http/controllers/customer-management.controller.spec.ts`.
- [ ] Implement `archiveCrmAccount` in `CustomerManagementGrpcAdapter`.
- [ ] Implement `archiveCrmAccount` in `CustomerManagementService`.
- [ ] Add `ArchiveCrmAccountDto` with `archiveReason` validation.
- [ ] Add `POST customer-management/tenants/:tenantId/crm-accounts/:crmAccountId/archive` guarded by `crm.account.manage`.
- [ ] Add `archiveReason` to BFF account mapping.
- [ ] Run focused API Gateway Jest specs.

## Task 7: Extension Workspace / Search Result Tests And Implementation

- [ ] Add failing BFF extension tests proving search results omit CRM misses.
- [ ] Add failing BFF extension tests proving archived records include `archiveReason` without BFF-side reason inference.
- [ ] Update extension workspace status rendering to support archived existing records.
- [ ] Add `archiveReason` to extension account/result types.
- [ ] Add failing browser extension annotation tests for separated tags: ownership, lifecycle, `Archived`, localized reason.
- [ ] Update `crm-page-annotations.ts` to build tags from account fields and skip missing/unknown results.
- [ ] Run `pnpm --dir app/browser-extension test:unit -- src/runtime/crm-page-annotations.spec.ts src/runtime/crm-search-automation.spec.ts`.

## Task 8: Verification

- [ ] Run `pnpm --filter @oes/common build`.
- [ ] Run `pnpm --filter crm-service build`.
- [ ] Run `pnpm --filter crm-service test:l1`.
- [ ] Run `pnpm --filter crm-service test:l2`.
- [ ] Run `pnpm --filter crm-service test:l3`.
- [ ] Run `pnpm --filter api-gateway build`.
- [ ] Run focused API Gateway Jest specs for CRM service.
- [ ] Run `pnpm --dir app/browser-extension typecheck`.
- [ ] Run `pnpm --dir app/browser-extension test:unit`.
- [ ] Run `pnpm --dir app/browser-extension build`.

## Completion Criteria

- CRM Lead / Prospect Customer archive requires `archiveReason`.
- Customer archive is still unsupported.
- `archiveReason` is persisted and returned by CRM gRPC and BFF JSON.
- Google result page shows no tag for CRM misses.
- Google result page shows separated ownership, lifecycle, archived, and archive reason tags for archived CRM hits.
- No raw backend status code or combination tag is rendered.
- All verification commands complete successfully.
