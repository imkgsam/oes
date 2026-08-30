# Public Business Card Public Boundary

featureKey: public-business-card-public-boundary
truthCommit: 0c8adcaf382c09fb56d9790b44a02de783a63ea8
baseSha: 0c8adcaf382c09fb56d9790b44a02de783a63ea8
integrationBranch: codex/public-business-card-public-boundary
worktreeKey: 2af8
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: RUNNING

## Objective

Close the anonymous `/public/business-cards/:businessCardId` page as one deterministic, task-owned acceptance surface: an `AVAILABLE` fixture renders public-safe fields, while missing or non-public cards stay inside the anonymous public shell with controlled `PUBLIC_CARD_NOT_FOUND` or `PUBLIC_CARD_UNAVAILABLE` semantics.

## Slices

### PBC-1 Public result boundary

state: RUNNING
candidate: pending
review: global-ri

- Scope: tenant-web core route and public BusinessCard view/API; the exact Gateway → Public Entry and Public Entry → frozen foundation target entries in the versioned local execution-token registry; focused route/view/API/trust tests.
- Protected scope: authenticated admin routes, generic authenticated 404 behavior, public-entry domain result vocabulary, wildcard or unrelated audience admission, permission policy semantics, and unrelated tenant-web pages.
- Dependencies: `docs/architecture/services/public-entry-service.md` and `docs/contracts/public-entry-service/business-card-public-render.md` at `truthCommit`.
- Acceptance: anonymous direct access and refresh never enter the authenticated 404/login flow; `AVAILABLE` renders the public-safe projection; missing cards show controlled not-found copy; disabled, unready, or upstream-unavailable cards show controlled unavailable copy; redirect query encoding is not involved; only exact contract-frozen Public Entry audiences are admitted and wildcard/unrelated targets remain denied.

### PBC-2 Task-owned published-card fixture

state: RUNNING
candidate: pending
review: global-ri

- Scope: public-entry-service idempotent seed entrypoint, isolated fixture identifiers/data, and focused seed replay/isolation tests.
- Protected scope: shared or production data, other service databases, employee/contact/tenant master-data ownership, credentials, and existing foundation seeds.
- Dependencies: task-owned worktree environment and the existing Public Entry Prisma schema.
- Acceptance: two consecutive seed runs converge to the same deterministic fixture set; the fixture includes available, disabled, and unavailable public results without draft/private-field disclosure; writes are limited to the task-owned Public Entry database and can be removed by the matching cleanup operation.

## Feature acceptance

- Reproduce the zero-row missing-card result and the previous public-view redirect into protected `/404` followed by `/auth/login?redirect=%252F404`.
- Cover `AVAILABLE`, `PUBLIC_CARD_NOT_FOUND`, disabled and readiness/upstream `PUBLIC_CARD_UNAVAILABLE` outcomes through focused tests.
- Prove anonymous auth bypass for direct access and refresh, with no login redirect or double-encoded redirect query.
- Prove the rendered payload is limited to the contract's public view and omits draft/private/contact-source fields.
- Replay the task-owned seed twice and prove deterministic rows plus Public Entry database isolation.
- Freeze one candidate, obtain independent Feature RI, then open a Draft PR without merging.
