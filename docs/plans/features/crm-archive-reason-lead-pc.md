# CRM Archive Reason For Lead / Prospect Customer

## Status

- `IMPLEMENTED_VERIFIED`
- Hub task: `crm-archive-reason-lead-pc`
- Created: `2026-06-23`

## Scope

This feature introduces CRM-owned archive reason semantics for `Lead` and `Prospect Customer` records so CRM can record why a real CRM subject is no longer in active follow-up, and so API Gateway / BFF / browser extension surfaces can display CRM truth without deriving business meaning outside `crm-service`.

In scope:

- `CrmAccount.recordStatus = ARCHIVED` runtime for `lifecycleStage = LEAD`.
- `CrmAccount.recordStatus = ARCHIVED` runtime for `lifecycleStage = PROSPECT_CUSTOMER`.
- Required `archiveReason` when archiving.
- CRM service domain, application, gRPC, Prisma persistence, audit envelope, and focused tests.
- API Gateway / BFF passthrough of `archiveReason` and `archivedAt`.
- Browser extension Google Search Result Page tag display based only on BFF-returned CRM records.

Out of scope:

- `Customer` archive.
- Restore / unarchive.
- Platform-link classification for Pinterest / Facebook / LinkedIn.
- Browser extension business judgment for low value, invalid target, non-target, or no-fit.
- New permission code design in `permission-service`.

## Current Design Conflict

The current CRM truth source states that `recordStatus = ARCHIVED` exists as a base extension value but CRM P1 does not expose Archive runtime, Archived list/filter, Archive reason, or `crm.account.archive`.

This feature changes that rule narrowly:

- Archive runtime is now allowed for `ACTIVE + LEAD` and `ACTIVE + PROSPECT_CUSTOMER`.
- Archive runtime remains disallowed for `CUSTOMER`.
- Archive reason becomes CRM service domain truth.

Before implementation, `docs/architecture/services/crm-service.md` must be updated as the stable service truth source. This file is currently ownership-blocked by another Hub thread, so implementation must wait for ownership release or Global Command resolution.

## Domain Model

`CrmAccount` gains:

- `archiveReason: CrmArchiveReason | null`

`archiveReason` is valid only when `recordStatus = ARCHIVED`. Active and draft records must persist `archiveReason = null`.

Archive reason enum:

- `LOW_VALUE`: real subject, low business value or low priority.
- `INVALID_TARGET`: nonexistent, wrong company, spam subject, or clearly invalid CRM subject.
- `NON_TARGET_ACCOUNT`: real subject, strategically not a current target, such as Kohler, Roca, TOTO, or Grohe.
- `COMPETITOR`: real subject confirmed by research as a peer company, competitor, or same-industry competitive entity.
- `DUPLICATE`: another CRM record already carries the same subject.
- `NO_FIT`: business category, region, product line, or market mismatch.
- `UNRESPONSIVE`: real subject but long-term unreachable or non-responsive.
- `OTHER`: real reason not covered by the fixed enum.

Rules:

- `ArchiveCrmAccount` requires `archiveReason`.
- `ArchiveCrmAccount` accepts only `recordStatus = ACTIVE`.
- `ArchiveCrmAccount` accepts only `lifecycleStage = LEAD` or `PROSPECT_CUSTOMER`.
- `ArchiveCrmAccount` sets `recordStatus = ARCHIVED`, `archiveReason`, and `archivedAt`.
- `ArchiveCrmAccount` does not change `lifecycleStage`, `tenantPartyId`, `ownerAccountId`, source records, contacts, opportunities, or activities.
- `Customer` archive attempts must fail with a domain/application validation error.
- Existing duplicate/list behavior that excludes archived records by default remains intact.
- Explicit archived lookup for extension display may use the existing account detail path or a focused search-result resolver, but BFF must not infer archive semantics.

## API / Contract Shape

CRM gRPC:

- Add `CrmAccountP1.archive_reason`.
- Add `ArchiveCrmAccountRequest` with `tenant_id`, `operator_context`, `trace_context`, `audit_context`, `crm_account_id`, and `archive_reason`.
- Add `ArchiveCrmAccountResponse.crm_account`.
- Add `CustomerManagementService.ArchiveCrmAccount`.

API Gateway / BFF:

- Account summaries include `archiveReason`.
- Archive command endpoint accepts only `archiveReason`.
- BFF permission uses existing `crm.account.manage` for this feature slice.
- BFF must not own archive reason labels or classification logic beyond display translation for extension tags.

Browser extension:

- Search-result resolver returns no tag-bearing item for CRM misses.
- Plugin does not render `UNKNOWN` or `未建档`.
- Plugin renders separate tags:
  - ownership: `我的`, `公海`, `他人`
  - lifecycle: `Lead`, `PC`, `Customer`
  - archive: `Archived`
  - archive reason: `低价值`, `无效`, `非目标`, `同行`, `重复`, `不匹配`, `无响应`, `其他`
- Plugin does not show raw backend status codes.
- Plugin does not show combination tags such as `CRM 我的 Lead`.

## Database Impact

`CrmAccount` requires one nullable column:

- `archiveReason` enum/string nullable

Recommended Prisma model:

- Add enum `CrmArchiveReason`.
- Add nullable `archiveReason CrmArchiveReason?` to `CrmAccount`.

Existing rows:

- `DRAFT` / `ACTIVE`: `archiveReason = null`.
- Historical `ARCHIVED` rows without reason may remain nullable legacy data unless a data governance task decides a controlled backfill.

## Tests

CRM service:

- L1 domain/application test: Lead archive requires reason and persists `ARCHIVED + archiveReason + archivedAt`.
- L1 domain/application test: Prospect Customer archive is allowed.
- L1 domain/application test: Customer archive is rejected.
- L2 repository test: `archiveReason` round-trips through Prisma persistence.
- L3 gRPC/controller test: archive command maps request, audit, and response.

API Gateway / BFF:

- Service mapping test: `archiveReason` passes from gRPC model to BFF JSON.
- Controller test: archive endpoint requires `crm.account.manage` and forwards tenant/account/reason.
- Extension workspace test: archived CRM match is returned as an existing CRM object with `archiveReason`; CRM miss is omitted from Google result tags.

Browser extension:

- Annotation test: archived PC with `NON_TARGET_ACCOUNT` renders `公海` or owner tag, `PC`, `Archived`, `非目标`.
- Annotation test: unknown/missing results render no tag.
- Annotation test: raw status code and combination tags are not displayed.

## Ownership Blocker

Hub denied core write claims on `2026-06-23` because active threads own the required implementation paths:

- `docs/architecture/services/crm-service.md`
- `docs/contracts/api-gateway/extension-crm-workspace.md`
- `src/services/business/crm-service/**`
- `src/common/src/contracts/crm_service/**`
- `src/services/api-gateway/src/modules/crm-service/**`
- `app/browser-extension/**`

This feature packet is therefore a handoff-ready design and execution entry. It must not be treated as fully implemented until the blocked truth-source and runtime paths are claimed and updated.

### Blocker Recheck

Rechecked on `2026-06-23` after the first blocker report:

- `crm-lead-entry-assignment` still owns `docs/architecture/services/crm-service.md`.
- `crm-lead-entry-assignment` still owns `src/services/business/crm-service/src/domain/models/crm-records.ts`.
- `crm-lead-entry-assignment` still owns `src/common/src/contracts/crm_service/crm.proto`.
- `crm-lead-entry-assignment` still owns `src/services/api-gateway/src/modules/crm-service/customer-management.service.ts`.
- `browser-extension-crm-workspace-p1-implementation` still owns `src/services/api-gateway/src/modules/crm-service/extension-crm-workspace.service.ts`.
- `browser-extension-crm-workspace-p1-implementation` still owns `app/browser-extension/**`.

Resume rule: once these owners return or release the conflicting paths, run `node scripts/oes-hub.mjs sync --thread crm-archive-reason-lead-pc`, claim the implementation paths again, then execute [2026-06-23-crm-archive-reason-lead-pc.md](/Users/acehood/Documents/GitHub/oes/docs/superpowers/plans/2026-06-23-crm-archive-reason-lead-pc.md) from Task 1.

### Stale Ownership Exception

On `2026-06-23`, the user explicitly confirmed that these blocking owners are stale historical Hub ownerships and granted a one-off exception to proceed without waiting for Hub ownership release. This exception is limited to this `crm-archive-reason-lead-pc` task and does not change the normal OES rule that future threads must claim paths before writing.

## Implementation Result

Implemented on `2026-06-23` under the stale ownership exception:

- `crm-service` owns `CrmArchiveReason`, `archiveReason`, archive validation and persistence.
- CRM gRPC exposes `ArchiveCrmAccount` and `CrmAccountP1.archive_reason`.
- API Gateway / BFF exposes `POST /customer-management/tenants/:tenantId/crm-accounts/:crmAccountId/archive` with existing `crm.account.manage`, and maps `archiveReason` / `archivedAt`.
- Tenant-web CRM account detail exposes an Archive action for eligible active Lead / Prospect Customer records and requires the operator to choose a CRM archive reason.
- Extension CRM workspace omits Google search result misses and returns archived CRM matches with CRM-owned `archiveReason`.
- Browser extension annotation runtime renders separated ownership, lifecycle, `Archived`, and localized archive reason tags, while skipping `UNKNOWN` results.

Verification completed:

- `pnpm --filter @oes/common build`
- `pnpm --filter crm-service build`
- `pnpm --filter crm-service test:l1`
- `pnpm --filter crm-service test:l2`
- `pnpm --filter crm-service test:l3`
- `pnpm --filter api-gateway build`
- `pnpm --filter api-gateway exec jest --runTestsByPath /Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/crm-service/customer-management.service.spec.ts /Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/crm-service/interface/http/controllers/customer-management.controller.spec.ts /Users/acehood/Documents/GitHub/oes/src/services/api-gateway/src/modules/crm-service/extension-crm-workspace.service.spec.ts --runInBand`
- `pnpm --dir app/web exec vitest run apps/tenant-web/src/api/bff/customer-management/index.spec.ts apps/tenant-web/src/views/admin/customer-management-detail.spec.ts --dom`
- `pnpm --dir app/web/apps/tenant-web typecheck`
- `pnpm --dir app/web/apps/tenant-web build`
- `pnpm --dir app/browser-extension typecheck`
- `pnpm --dir app/browser-extension test:unit`
- `pnpm --dir app/browser-extension build`
