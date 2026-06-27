# CRM Archive Reason Lead / PC Design

## Goal

Give CRM a first-class, auditable reason for moving a Lead or Prospect Customer out of active follow-up, and let downstream BFF / browser extension surfaces display that CRM-owned reason without inventing their own business classification.

## Current State

`CrmAccount.recordStatus` already includes `ARCHIVED`, and `CrmAccount` already has `archivedAt`. The current stable CRM service document says CRM P1 does not expose archive runtime or archive reason. This design narrows that rule by enabling archive only for `Lead` and `Prospect Customer`.

Customer archive remains outside this design because CRM P1 currently does not define Customer archive semantics, restore semantics, sales/order side effects, or historical customer governance.

## Decisions

### Domain Ownership

`archiveReason` belongs to `crm-service`. It is not a BFF, API Gateway, browser extension, or AI-derived field.

`archiveReason` records organizational consensus about why CRM no longer treats a real Lead or Prospect Customer as active follow-up. The reason does not delete the CRM object and does not erase its source history.

### Eligible Records

Allowed:

- `ACTIVE + LEAD`
- `ACTIVE + PROSPECT_CUSTOMER`

Rejected:

- `DRAFT + LEAD`
- `ARCHIVED + LEAD`
- `ARCHIVED + PROSPECT_CUSTOMER`
- any `CUSTOMER`

Archive does not change lifecycle. A Lead remains a Lead; a Prospect Customer remains a Prospect Customer.

### Archive Reason Enum

- `LOW_VALUE`: true subject with low commercial value, low priority, or weak expected return.
- `INVALID_TARGET`: nonexistent, wrong company, spam subject, or clearly invalid CRM subject.
- `NON_TARGET_ACCOUNT`: true subject that is strategically outside the current target set, including large brands such as Kohler / Roca / TOTO / Grohe when they should not be labeled invalid.
- `DUPLICATE`: another CRM record already carries the same subject.
- `NO_FIT`: category, region, product line, or target-market mismatch.
- `UNRESPONSIVE`: true subject with long-term no contact or no response.
- `OTHER`: reason is valid but not represented by the fixed enum.

### Persistence

Add nullable `archiveReason` to `CrmAccount`.

`archiveReason` must be non-null when a new command transitions a record into `ARCHIVED`. It remains nullable at the database level so historical archived rows and rollout sequencing do not require unsafe backfill.

### Command

`ArchiveCrmAccount`:

- Requires tenant context, operator context, trace context, and audit context.
- Requires `archiveReason`.
- Loads account by tenant and id.
- Rejects missing account.
- Rejects non-active account.
- Rejects lifecycle stages other than `LEAD` and `PROSPECT_CUSTOMER`.
- Saves `recordStatus = ARCHIVED`, `archiveReason`, and `archivedAt = now`.
- Leaves owner, lifecycle, party binding, priority, source records, contacts, activities, and opportunities unchanged.

### Permissions

This slice uses existing `crm.account.manage` in API Gateway. It does not introduce `crm.account.archive` because permission-code changes require permission-service design and seed ownership that are outside this thread's current scope.

### BFF / Extension

API Gateway maps CRM account payloads to include `archiveReason`.

The extension workspace contract treats `archiveReason` as display-only data from CRM. Google Search Result Page rules:

- matched CRM object: render tags from returned BFF data.
- CRM miss: render no tag.
- archived CRM object: render ownership tag, lifecycle tag, `Archived`, and localized archive reason.
- no raw status-code tags.
- no combination tag such as `CRM 我的 Lead`.

## Risks

- Existing duplicate check paths currently default to `DRAFT` and `ACTIVE`; archived records may need a separate lookup path for search-result display if duplicate check intentionally excludes archive status.
- The browser extension implementation path is currently owned by another active Hub thread. Merging order must avoid overwriting its in-flight workspace implementation.
- Historical `ARCHIVED` rows can have `archiveReason = null`; UI must handle null reason as absent rather than inventing `OTHER`.

## Verification

Completion requires evidence from:

- CRM service L1/L2/L3 tests.
- API Gateway/BFF unit/controller tests.
- Browser extension unit tests.
- Typecheck/build for affected packages.
- Updated CRM truth source and extension contract docs.

This design is not complete as implementation until Hub ownership allows updating the truth-source and runtime files.
