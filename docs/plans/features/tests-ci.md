# Tests And Continuous Integration

```text
featureKey: tests-ci
truthCommit: 8638401207d3d94fd3695e8d5e25deaf3e2a760a
integrationBase: 73208754c0b8323ae06dc5b901fca8f936e57c2d
baseSha: 31e07cd7f56d55e4c421fcfea791991bb13eb80c
dependencyCandidates:
  gateway-events: 31e07cd7f56d55e4c421fcfea791991bb13eb80c
integrationBranch: codex/feature/tests-ci
worktreeKey: tests-ci
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: ACTIVE
```

## Objective

Make the repository test and continuous-integration surface reproducible from a clean worktree. Repair the assigned Common, Gateway, Auth, Public Entry, CRM, Item Master, Permission, and Browser Activity failures at their real boundary; isolate every database-backed L2 run to task-owned databases, ports, and resources; provide discoverable fail-closed layered test commands; and make CI generate, build, and risk-test the complete declared backend and applicable Site Runtime workspace.

Stable service boundaries, service-owned data, internal gRPC, the event bus, and tenant/org/operator/trace/audit semantics remain unchanged.

## Invariants

- A clean frozen install followed by repository-declared generation, build, and test commands is sufficient; success never depends on ignored files or another worktree's containers.
- Every L2 database is task-owned, uniquely named, derived from the worktree environment, and checked before mutation; no test reads or writes a shared or cross-service database.
- Unified test commands are discoverable, deterministic, fail-closed, and include every assigned known-red suite. A missing script, missing generated artifact, empty test selection, hidden skip, lowered assertion, or swallowed subprocess failure is a failure.
- Unit tests isolate external adapters only at the declared boundary. Contract, component, and L2 acceptance that requires a live database or transport uses the real task-owned boundary.
- CI uses the frozen lockfile, generates Proto and all 21 Prisma Clients, builds Common, Gateway, all 21 backend services, and applicable Site Runtime packages, then executes the risk-mapped test layers.
- Proto lint, generation, and breaking detection compare against the canonical integration base rather than the feature branch itself.
- Test fixes preserve contract meaning and product behavior. Any required stable semantic change is a `DESIGN_GAP` rather than a fixture workaround.
- Runtime and evidence resources are owner-local. Production/shared data, new secrets, host/system privilege, cross-owner writes, main merge, and cleanup remain protected.

## Slices

### TC-1 — Risk route and baseline red inventory

```text
state: ACTIVE
candidate: pending
review: pending
```

- Scope: enumerate every package/test script/configuration and reproduce Common, Gateway, Auth, Public Entry, CRM, Item Master, Permission, Browser Activity, browser UI, L2, full-build, and CI failures from the exact dependency candidate.
- Acceptance: each command records exact input, literal output, exit status, elapsed time, and classification as product, fixture, environment, or already-green dependency evidence; no failing assigned suite is omitted from the implementation route.

### TC-2 — Assigned red-suite formal repairs

```text
state: BLOCKED_ON_TC_1
candidate: pending
review: pending
```

- Scope: repair the minimum production, fixture, or test-runner defect for the assigned Common, Gateway, Auth, Public Entry, CRM, Item Master, Permission, and Browser Activity suites.
- Acceptance: positive, boundary, rejection, teardown, and applicable tenant/trust/idempotency behavior pass without broad mocks, assertion weakening, hard skips, or unrelated refactors.

### TC-3 — Task-owned L2 isolation

```text
state: BLOCKED_ON_TC_1
candidate: pending
review: pending
```

- Scope: unify task-derived L2 database preparation and lifecycle for every database-backed suite, including collision checks, migrations/schema preparation, bounded seed/fixture application, and exact teardown.
- Acceptance: two isolated worktree keys can run without database/port/resource collision; a missing or foreign resource fails before mutation; repeat runs are deterministic; every created resource is either retained by explicit owner state or removed by the same bounded run.

### TC-4 — Unified layered test commands

```text
state: BLOCKED_ON_TC_2_TC_3
candidate: pending
review: pending
```

- Scope: add root/package scripts and a versioned orchestrator for static, focused/unit, L2/component, contract/integration, and risk suites.
- Acceptance: commands discover the expected workspace/package set, reject missing scripts or empty selections, propagate exact child exit codes, write a machine-readable summary, and keep assigned known-red suites in the default risk entrypoint.

### TC-5 — Complete CI build and risk gates

```text
state: BLOCKED_ON_TC_4
candidate: pending
review: pending
```

- Scope: extend CI after frozen install to run env-independent generation, Common/Gateway/21-service/Site Runtime builds, layered risk tests, task-owned L2, and Proto lint/gen/breaking against the exact canonical base.
- Acceptance: a clean local CI-equivalent run and hosted required workflow use the same repository-owned commands; generated or package omissions, proto breaking, failed tests, and missing evidence fail the job.

### TC-6 — Feature Review and frozen candidate

```text
state: BLOCKED_ON_TC_5
candidate: pending
review: pending
```

- Scope: map each acceptance criterion to reproducible evidence, freeze one candidate, and obtain independent read-only Global RI acceptance.
- Acceptance: Feature Review and Global RI accept the exact candidate; only then may the parent issue single-use remote publication authorization; the independent Draft PR required CI must succeed before `READY_FOR_STAGE_REVIEW`.

## Feature acceptance

1. The assigned Common, Gateway, Auth, Public Entry, CRM, Item Master, Permission, and Browser Activity test surfaces pass from a clean worktree, and every repaired failure has symptom, trigger, root cause, formal fix, and root-cause proof.
2. All database-backed L2 tests use task-owned databases and resources with collision-safe preparation and teardown; no acceptance result depends on another worktree or pre-existing container.
3. Root-level layered test commands are discoverable and fail-closed, include the assigned suites, propagate failures, reject empty/missing selections, and emit exact evidence.
4. CI performs frozen installation, Proto and 21-client generation, Common/Gateway/all-21-service/applicable-Site builds, risk-driven tests, isolated L2, and Proto lint/gen/breaking against the canonical base.
5. A fresh clone can reproduce the CI-equivalent route and the task-owned L2 route with zero normal permission prompts and no residual task runtime.
6. Stable architecture and contracts remain unchanged. The candidate retains exact gateway-events ancestry; self-review, independent Global RI, independent Draft PR, and required CI precede Stage Review readiness.

## Validation route

- Static: dependency ancestry, workspace/package/script inventory, CI YAML semantics, expected-test manifest, empty-selection guard, changed-path risk mapping, secret scan, format, and `git diff --check`.
- Focused/unit: Common, Gateway, Auth, Public Entry, CRM, Item Master, Permission, Browser Activity, browser UI logic, test orchestrator exit propagation, and L2 ownership/collision guards.
- Component: production module graphs and adapter boundaries touched by formal repairs, with teardown/resource-release assertions.
- Contract/integration: Proto lint/gen/breaking, Gateway/auth/permission/public-entry contract tests, and database-backed service L2 against task-owned databases.
- Build: Common, Gateway, 21 services, all 21 Prisma Clients, and applicable Site Runtime packages from frozen dependencies and clean generated output.
- Reliability: two-key L2 isolation, missing/foreign database rejection, failed migration/seed/test propagation, rerun determinism, process interruption, and exact resource teardown.
- Review: FL Feature Review, independent read-only Global RI on the frozen candidate, Draft PR required CI, then parent SL Stage Review.

## Baseline inventory contract

The baseline inventory is written under the owner-local evidence root and summarized here after TC-1. It must contain one row per executed command with:

```text
surface | layer | exact command | dependency SHA | environment key
literal result | exit status | elapsed time | classification | disposition
```

Existing FL-1 through FL-4 evidence is reused only when candidate, dependency, inputs, environment, and command version remain unchanged and it covers the present risk. Any test/CI/configuration change invalidates the intersecting coverage and triggers the affected route above.

## Current evidence

- Capability smoke: frozen install; Git switch/add/commit and rollback; environment bootstrap/check for 21 databases; generated Common build; collaboration runtime 67/67; task-owned PostgreSQL write/read; owner-local HTTP/localhost; approved origin network; evidence reopen; zero normal permission prompts.
- Capability smoke key: `capability-smoke/` under the bound owner-local evidence root.

## Remote state

No remote mutation has occurred. Global RI acceptance on the exact frozen candidate is required before an immutable publication request can be issued to the parent.
