# CRM Source Record Closure

## 1. Feature Status

Current status: `phase 1 implementation in progress / phase 2 deferred`

This feature closes the CRM P1 source-record read loop for customer detail pages. The stable object semantics remain owned by [crm-service.md](../../architecture/services/crm-service.md). This packet defines the Phase 1 execution boundary, API surface, UI behavior, and verification plan only.

Phase 2 manual management is intentionally not frozen in this packet. It has been moved to [backlog.md](../backlog.md) because source-record creation, primary-source mutation, evidence validation, permission, and audit semantics still need a separate design discussion.

## 2. Problem

`CrmSourceRecord` already exists as a stable CRM object and is persisted by core write paths such as `CreateLead`, `CreateDraftLead`, and `SubmitDraftLead`. The current detail page still renders the `来源记录` tab as a hard-coded empty state because the read and management surfaces are not fully exposed through gRPC, API Gateway, tenant-web BFF, and UI.

This is a partial backend closure:

- Domain model exists.
- Prisma table exists.
- Repository supports `addSourceRecord` and `listSourceRecords`.
- Lead creation paths can write primary source records.
- Query/application/gRPC/API Gateway/tenant-web read path is missing.
- Manual source creation and primary-source management are not exposed and are outside this Phase 1 packet.

## 3. Goals

- Show real source records in CRM account detail.
- Preserve `CrmSourceRecord` as the source-history truth instead of adding `sourceSummary` fields to `CrmAccount`.
- Make each source record traceable to a concrete origin, not just a type label.

## 4. Non-Goals

- Do not add `sourceSummary` or latest-source fields to `CrmAccount`.
- Do not implement source deletion in this slice.
- Do not implement full activity timeline closure.
- Do not implement contact, opportunity, campaign attribution, or BI attribution models.
- Do not change CRM ownership, lifecycle, archive, or Party binding semantics.

## 5. Source Evidence Rules

Every source record must have `sourceType`, `capturedAt`, and enough evidence for a human operator to understand where it came from.

Minimum evidence by source type:

| Source Type | Minimum Evidence |
| --- | --- |
| `WEBSITE_FORM` | form/page identifier, page URL or external reference, submit time |
| `BROWSER_EXTENSION` | page URL, page title or domain, captured time |
| `WEB_RESEARCH` | researched URL/domain, captured time, optional note |
| `IMPORTED_LIST` | import batch/reference, row number or raw row summary |
| `BUSINESS_CARD` | card file/reference or manual note |
| `EXHIBITION_SCAN` | exhibition/campaign reference or scan reference |
| `AD_CAMPAIGN` | campaign/ad reference or landing page reference |
| `REFERRAL` | referrer/channel note |
| `PEER_TRANSFER` | transfer source note or external reference |
| `SOCIAL_MEDIA` | profile/post URL or social handle |
| `OTHER` | mandatory note |

`rawPayload` remains evidence/debug payload, not business truth. UI may show it as a collapsed technical detail, not as the primary business label.

## 6. Runtime Phases

### Phase 1: Read Closure

Expose source records for CRM account detail.

CRM service:

- Add `ListSourceRecordsQuery`.
- Add `ListSourceRecordsHandler`.
- Use existing repository `listSourceRecords(tenantId, accountId)`.
- Return source records ordered by `capturedAt desc` or `isPrimary desc, capturedAt desc`; implementation should pick one and keep it stable. Recommended: primary first, then newest first.

gRPC:

- Add `CrmSourceRecord` message.
- Add `ListSourceRecordsRequest`.
- Add `ListSourceRecordsResponse`.
- Add `ListSourceRecords` RPC to the appropriate CRM customer management/query service surface.

API Gateway:

- Add `GET /customer-management/tenants/:tenantId/crm-accounts/:crmAccountId/source-records`.
- Require `crm.account.read`.
- Preserve tenant/operator/trace context propagation.

tenant-web:

- Add `listCrmSourceRecordsApi`.
- Load source records in customer detail.
- Render `来源记录` tab with loading, empty, error, and list/table states.

### Deferred Phase 2: Manual Management Closure

Manual source creation and primary-source selection are deferred. They must not be implemented from this packet. The future scope is tracked as a Product Deferred backlog item and should become a separate feature packet only after the write contract, evidence validation, permission, and audit model are discussed and frozen.

## 7. API Shape

Source record DTO fields:

- `sourceRecordId`
- `crmAccountId`
- `sourceType`
- `sourceName`
- `capturedAt`
- `capturedByAccountId`
- `capturedByDisplayName`
- `externalReference`
- `note`
- `isPrimary`
- `rawPayload`
- `createdAt`
- `updatedAt`

No manual create or primary-source mutation request shape is frozen in this packet.

## 8. Permission And Audit

Read source records:

- Permission: `crm.account.read`.

Create or change source-record permissions and audit are deferred with Phase 2.

## 9. UI Behavior

The CRM account detail `来源记录` tab should show:

- Primary source badge.
- Source type label.
- Source name or fallback label.
- Captured time.
- Captured by.
- External reference as a copyable/link-like value when safe.
- Note.
- Collapsible raw payload summary.

Empty state should mean no source records returned from API, not a hard-coded placeholder.

No manual add or primary-source action appears in the Phase 1 UI.

## 10. Verification

CRM service tests:

- `CreateLead` creates one primary source record.
- `CreateDraftLead` preserves draft source record.
- `SubmitDraftLead` does not duplicate existing source records.
- `ListSourceRecords` returns tenant-scoped records only.

API Gateway tests:

- Read endpoint maps gRPC source records to BFF DTO.
- Permission guards are applied.

tenant-web tests:

- Detail page calls `listCrmSourceRecordsApi`.
- Source tab renders returned records.
- Empty state only appears for empty API results.

## 11. Implementation Order

1. Add read contract and CRM query handler.
2. Expose Gateway GET endpoint.
3. Add tenant-web BFF function and render source tab.
4. Stop. Manual create and set-primary remain deferred to a future feature packet.

Phase 1 can ship independently because it only reads already-persisted source records. Phase 2 should ship only after permission catalog and audit verification are discussed and frozen in a separate packet.
