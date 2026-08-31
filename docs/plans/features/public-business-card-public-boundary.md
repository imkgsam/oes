# Public Business Card Public Boundary

featureKey: public-business-card-public-boundary
truthCommit: ddd1d4864552e591c94408615b9fac9d418228a3
baseSha: b589b41880fdaed84e4b35d3383f7a0d1e325739
integrationBranch: codex/public-business-card-public-boundary
worktreeKey: 2af8
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: RUNTIME_VALIDATING
implementationCandidateAncestor: 3c3e9cd7337de1197045e8ffe3b12a11a5af0616
review: pending same Runtime Owner, then independent Feature RI

## Objective

Close the anonymous `/public/business-cards/:businessCardId` page as one deterministic, task-owned acceptance surface: an `AVAILABLE` fixture renders public-safe fields, while missing or non-public cards stay inside the anonymous public shell with controlled `PUBLIC_CARD_NOT_FOUND` or `PUBLIC_CARD_UNAVAILABLE` semantics.

## Slices

### PBC-1 Public result boundary

state: RUNTIME_VALIDATING
candidate: 0e77938afd73ea1efa3819c77e230a7ecd78115d
review: pending-runtime

- Scope: tenant-web core route and public BusinessCard view/API; the exact Gateway → Public Entry and Public Entry → frozen foundation target entries in the versioned local execution-token registry; focused route/view/API/trust tests.
- Protected scope: authenticated admin routes, generic authenticated 404 behavior, public-entry domain result vocabulary, wildcard or unrelated audience admission, permission policy semantics, and unrelated tenant-web pages.
- Dependencies: `docs/architecture/services/public-entry-service.md` and `docs/contracts/public-entry-service/business-card-public-render.md` at `truthCommit`.
- Acceptance: anonymous direct access and refresh never enter the authenticated 404/login flow; `AVAILABLE` renders the public-safe projection; missing cards show controlled not-found copy; disabled, unready, or upstream-unavailable cards show controlled unavailable copy; redirect query encoding is not involved; only exact contract-frozen Public Entry audiences are admitted and wildcard/unrelated targets remain denied.

### PBC-2 Task-owned published-card fixture

state: CANDIDATE_READY
candidate: 0e77938afd73ea1efa3819c77e230a7ecd78115d
review: pending-feature-candidate

- Scope: public-entry-service idempotent seed entrypoint, isolated fixture identifiers/data, and one task-owned Permission SYSTEM role/binding granting the exact Gateway machine principal only `public-entry.business-card.read`; focused seed replay/isolation tests.
- Protected scope: shared or production data, non-task databases, employee/contact/tenant master-data ownership, credentials, existing foundation roles/bindings, wildcard audiences, and every Permission Code other than exact public BusinessCard read.
- Dependencies: task-owned worktree environment and the existing Public Entry Prisma schema.
- Acceptance: two consecutive seed runs converge to the same deterministic fixture set; the fixture includes available, disabled, and unavailable public results without draft/private-field disclosure; writes are limited to the task-owned Public Entry rows plus one task-owned Permission role, one exact role-permission edge, and one Gateway MACHINE/SYSTEM binding, all removed by the matching cleanup operation with foreign-conflict protection.

## Feature acceptance

- Reproduce the zero-row missing-card result and the previous public-view redirect into protected `/404` followed by `/auth/login?redirect=%252F404`.
- Cover `AVAILABLE`, `PUBLIC_CARD_NOT_FOUND`, disabled and readiness/upstream `PUBLIC_CARD_UNAVAILABLE` outcomes through focused tests.
- Prove anonymous auth bypass for direct access and refresh, with no login redirect or double-encoded redirect query.
- Prove the rendered payload is limited to the contract's public view and omits draft/private/contact-source fields.
- Replay the task-owned seed twice and prove deterministic rows plus Public Entry database isolation.
- Freeze one candidate, obtain independent Feature RI, then open a Draft PR without merging.

## Design resolution

- Exact design truth merged at `ddd1d4864552e591c94408615b9fac9d418228a3` and freezes three dedicated INTERNAL owner resolvers: HR `ResolvePublicBusinessCardEmployee`, Identity `ResolvePublicBusinessCardIdentity`, and TenantOrg `ResolvePublicBusinessCardOrganization`.
- Candidate `0e77938afd73ea1efa3819c77e230a7ecd78115d` implements the three WORKLOAD_POLICY-only SYSTEM Codes, exact Public Entry workload issuance tuples, tenantless MACHINE calls, target-owned selector/resource checks, and a request-private aggregate with at most one read per owner per operation.
- Public Entry no longer uses the five protected BUSINESS reads in anonymous readiness/render/vCard composition. Existing BUSINESS methods remain unchanged for their existing consumers, and TenantOrg explicitly rejects the removed Public Entry BUSINESS exceptions.
- Required owner or trust failure remains generic `PUBLIC_CARD_UNAVAILABLE`; optional contact or website loss omits only the corresponding public field/action.

## Candidate verification

- Proto lint, generation, and breaking against latest `origin/main` pass.
- TypeScript builds pass for Common, Auth, Permission, HR, Identity, TenantOrg, and Public Entry.
- Affected suites pass: Common 292/292; HR L1/L2/L3 74/74; Identity L1/L2 184/184; TenantOrg L1/L2/L3 93/93; Public Entry 58/58; Permission L1/L2/L3 407/407; Auth 431/431.
- Workload-policy profile and tests pass; database lifecycle 16/16 and trusted-runtime inventory 10/10 pass; task-scoped HR, Identity, TenantOrg, and Permission L2 databases pass 67/67 tests.
- Next gate is same Runtime Owner revalidation of AVAILABLE, NOT_FOUND, DISABLED, UNAVAILABLE, exact owner-call counts, negative workload/audience/Code/cnf/selector cases, and browser refresh behavior. Independent Feature RI opens only after that runtime gate passes.
