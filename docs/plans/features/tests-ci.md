# Tests And Continuous Integration

```text
featureKey: tests-ci
truthCommit: 8638401207d3d94fd3695e8d5e25deaf3e2a760a
integrationBase: 3fef3227bfb11c976e3bf4ad863e998b9e082701
baseSha: 31e07cd7f56d55e4c421fcfea791991bb13eb80c
dependencyCandidates:
  gateway-events: 31e07cd7f56d55e4c421fcfea791991bb13eb80c
integrationBranch: codex/feature/tests-ci
worktreeKey: tests-ci
pullRequest: 31
mergeSha: pending
cleanup: HOLD
reviewedCodeCandidate: e2d9f8acb9012f539b2919d23e17ca41ded48f3d
globalRiCandidate: 285bfb0a81fba5c1984815afdda7c654f58b1451
globalRiResult: GLOBAL_RI_ACCEPT findings none
state: FEATURE_REVIEW
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
state: COMPLETE
candidate: e2d9f8acb9012f539b2919d23e17ca41ded48f3d
review: FL_ACCEPT
```

- Scope: enumerate every package/test script/configuration and reproduce Common, Gateway, Auth, Public Entry, CRM, Item Master, Permission, Browser Activity, browser UI, L2, full-build, and CI failures from the exact dependency candidate.
- Acceptance: each command records exact input, literal output, exit status, elapsed time, and classification as product, fixture, environment, or already-green dependency evidence; no failing assigned suite is omitted from the implementation route.

### TC-2 — Assigned red-suite formal repairs

```text
state: COMPLETE
candidate: e2d9f8acb9012f539b2919d23e17ca41ded48f3d
review: FL_ACCEPT
```

- Scope: repair the minimum production, fixture, or test-runner defect for the assigned Common, Gateway, Auth, Public Entry, CRM, Item Master, Permission, and Browser Activity suites.
- Acceptance: positive, boundary, rejection, teardown, and applicable tenant/trust/idempotency behavior pass without broad mocks, assertion weakening, hard skips, or unrelated refactors.

### TC-3 — Task-owned L2 isolation

```text
state: COMPLETE
candidate: e2d9f8acb9012f539b2919d23e17ca41ded48f3d
review: FL_ACCEPT
```

- Scope: unify task-derived L2 database preparation and lifecycle for every database-backed suite, including collision checks, migrations/schema preparation, bounded seed/fixture application, and exact teardown.
- Acceptance: two isolated worktree keys can run without database/port/resource collision; a missing or foreign resource fails before mutation; repeat runs are deterministic; every created resource is either retained by explicit owner state or removed by the same bounded run.

### TC-4 — Unified layered test commands

```text
state: COMPLETE
candidate: e2d9f8acb9012f539b2919d23e17ca41ded48f3d
review: FL_ACCEPT
```

- Scope: add root/package scripts and a versioned orchestrator for static, focused/unit, L2/component, contract/integration, and risk suites.
- Acceptance: commands discover the expected workspace/package set, reject missing scripts or empty selections, propagate exact child exit codes, write a machine-readable summary, and keep assigned known-red suites in the default risk entrypoint.

### TC-5 — Complete CI build and risk gates

```text
state: COMPLETE
candidate: e2d9f8acb9012f539b2919d23e17ca41ded48f3d
review: FL_ACCEPT
```

- Scope: extend CI after frozen install to run env-independent generation, Common/Gateway/21-service/Site Runtime builds, layered risk tests, task-owned L2, and Proto lint/gen/breaking against the exact canonical base.
- Acceptance: a clean local CI-equivalent run and hosted required workflow use the same repository-owned commands; generated or package omissions, proto breaking, failed tests, and missing evidence fail the job.

### TC-6 — Feature Review and frozen candidate

```text
state: COMPLETE
candidate: 285bfb0a81fba5c1984815afdda7c654f58b1451
review: FL_ACCEPT; GLOBAL_RI_ACCEPT findings none
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

### Baseline red inventory and disposition

| Surface                           | Trigger and classification                               | Root cause                                                                                                                     | Formal disposition                                                                                                                                             |
| --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Common                            | Real Common Jest/TypeScript surface; fixture             | direct guard/interceptor fixtures lagged the frozen trusted-context constructor                                                | construct the exact verified workload/token inputs; keep denial assertions intact                                                                              |
| Gateway                           | Real Gateway unit/integration surface; product + fixture | avatar/profile adapter results and Auth/Party request fixtures lagged current contracts                                        | map the declared result fields, bind the Party adapter error boundary, and use current HTTP/gRPC fixtures                                                      |
| Auth                              | Real Auth unit surface; fixture                          | Jest discovery/type roots and Redis mock names conflicted with Jest hoisting; several constructors lagged current dependencies | version explicit Jest/TypeScript configs and current constructor fixtures; use hoist-safe mock names                                                           |
| Public Entry                      | Real Public Entry L1 surface; fixture                    | adapter doubles omitted the current trusted upstream methods and request context                                               | complete the narrow adapter doubles and assert the real rejection/result mapping                                                                               |
| CRM                               | Real trusted-gRPC L3 surface; `DESIGN_GAP`               | frozen Collaboration OBO scope does not satisfy Permission admission and Auth exchange authority                               | keep one named expected-failure lane that actually executes and asserts the three fail-closed errors; no skip or relaxed assertion                             |
| Item Master                       | Real trusted-gRPC security surface; fixture              | signing/registry fixtures used stale workload and context fields                                                               | construct certificate-bound current fixtures and retain forged/missing-context rejection assertions                                                            |
| Permission                        | Real Permission L3 surface; fixture                      | request-context constructor and Jest roots lagged trusted admission                                                            | bind verified context and version exact discovery config                                                                                                       |
| Browser Activity                  | Real L1/L2 surfaces; fixture/environment                 | stale context fields and implicit service environment                                                                          | use current context and task-owned service database binding                                                                                                    |
| L2 matrix                         | All repository `test/l2/**/*.spec.ts`; environment       | helpers fell back to package `.env` and the repository had no owner-bound lifecycle orchestrator                               | honor `OES_L2_DATABASE_URL`; discover 18 non-empty package surfaces; create/migrate/run/rollback one task-owned 21-database stack in `finally`                 |
| Site L2                           | Slug/category concurrent writes; product + fixture       | locale CAS did not serialize against the stable parent identity; Category persistence leaked obsolete input fields             | lock the owned Content parent before reservation/CAS and project only current Category persistence fields                                                      |
| Notification/SRM/Collaboration L2 | Live module boundaries; fixture                          | direct guard injections lacked declared String audience providers; SRM audit used unverified context                           | export/bind the stable audience token and run SRM through `GrpcRequestContextStore` with verified HUMAN context                                                |
| CI                                | Required workflow; infrastructure                        | partial build/test coverage, mutable install assumptions, and no immutable proto-breaking comparison                           | frozen install, task environment, Proto lint/gen/breaking, complete build, non-empty inventory, design-gap, risk, isolated L2, and unconditional residue check |

### Implemented layered commands

- `pnpm test:matrix:check`: discovers exactly 8 assigned unit surfaces and all 18 L2 package surfaces; rejects missing configs, empty selection, failed, skipped, or todo results.
- `pnpm test:tooling`: validates environment, reproducible build inventory, database lifecycle, matrix selection/result gates, and immutable Proto comparison.
- `pnpm test:unit`: runs the exact Common, Gateway, Auth, Public Entry, CRM, Item Master, Permission, and Browser Activity surfaces.
- `pnpm test:design-gap`: executes the named CRM stable-conflict lane and all neighboring trusted-gRPC assertions.
- `pnpm test:l2`: prepares Proto and 21 Prisma Clients, starts owner-labelled infrastructure, migrates 21 task databases, runs all discovered L2 tests on explicit database/NATS/trust inputs, and rolls back in `finally`.
- `pnpm test:risk`: runs tooling, assigned unit/contract tests, Collaboration Runtime checks, and the stable foundation atomic-group regression.
- `pnpm test:ci`: ensures or validates the task-owned environment without rewriting it, then composes Proto lint/gen/breaking, the complete backend/Site Runtime build, risk tests, and isolated L2.

### Literal owner-worktree results

- `pnpm test:matrix:check`: `TEST_MATRIX_CHECK=PASS packages=8`; `L2_MATRIX_CHECK=PASS packages=18 suites=59`; exit 0.
- `pnpm test:tooling`: 40 tests passed, 0 failed/skipped/todo; exit 0, including regressions that reject repository-root certificate serial residue, bootstrap a missing CI/L2 environment only once, validate the exact existing binding without rewriting it, and keep the OpenSSL CA serial below the task-owned output root.
- `pnpm test:unit`: `TEST_MATRIX_UNIT=PASS packages=8 suites=435 tests=1952`; exit 0.
- `pnpm test:design-gap`: 29 tests passed, 0 failed/skipped/todo; the named lane asserted Permission `AUTHORIZATION_SCOPE_MISMATCH`, Auth `execution token exchange lacks an authoritative Permission decision`, and producer `COLLABORATION_FOUNDATION_EXECUTION_UNAVAILABLE`; exit 0.
- `pnpm collaboration-runtime:check`: 67 tests passed and `collaboration-runtime static checks: PASS`; exit 0.
- `node --test scripts/local/foundation-trusted-grpc-atomic-group.spec.mjs`: 5 tests passed, 0 failed/skipped/todo; exit 0. The regression reads canonical architecture truth and `docker/grpc-trust/workloads.txt`, never a cleanup-deleted process packet.
- `pnpm proto:lint && pnpm proto:gen && OES_PROTO_BREAKING_BASE=73208754c0b8323ae06dc5b901fca8f936e57c2d pnpm proto:breaking`: pass; immutable comparison ancestry accepted; exit 0.
- `pnpm build`: `BACKEND_PACKAGE_COUNT=22`, `PRISMA_SCHEMA_COUNT=21`, `ROOT_TSC_REFERENCE_COUNT=23`, `SITE_RUNTIME_LEAF_COUNT=5`, `REPRODUCIBLE_BUILD_CHECK=PASS`; all backend and Site Runtime builds passed; exit 0.
- `pnpm test:l2`: `TEST_MATRIX_L2=PASS packages=18 suites=59 tests=185`, followed by `DATABASE_ROLLBACK=PASS`; exit 0.
- Affected final Site rerun: `node scripts/local/l2-test-runner.mjs run site-service` reported 8 suites and 43 tests passed, then `DATABASE_ROLLBACK=PASS`; exit 0.
- Final task-owned resource readback after verification: owner-local processes 0; Docker containers 0, volumes 0, networks 0; generated/cache status additions 0. Gateway certificate serial state is written under its disposable test workspace, and the complete 1,952-test unit rerun left repository-root `.srl` residue at 0.

### Feature Review

The FL rejected two provisional clean-review attempts instead of reclassifying them as success. The first invoked the CRM design-gap lane before its declared Common build dependency and produced `Cannot find module '@oes/common/authorization'`; the corrected dependency order is now encoded by the CI workflow. The next exposed that an explicit pre-bootstrap task key was lost when L2 re-ran bootstrap, and a later empty-environment run exposed that `test:risk` needed environment preparation before the terminal L2 step. The formal fix is the repository-owned `env:ensure` command: it bootstraps only when `.env` is absent, otherwise runs the complete check and rejects an explicitly requested key that does not match the existing binding. L2 and `test:ci` use this command without force or file deletion.

Exact clean-review route at code candidate `e2d9f8acb9012f539b2919d23e17ca41ded48f3d`:

- New detached worktree, empty environment, and frozen install: `INITIAL_ENV=ABSENT`, `INITIAL_ROOT_SRL=ABSENT`; `pnpm install --frozen-lockfile` exit 0.
- `pnpm test:matrix:check`: `TEST_MATRIX_CHECK=PASS packages=8`; `L2_MATRIX_CHECK=PASS packages=18 suites=59`; exit 0.
- `OES_PROTO_BREAKING_BASE=73208754c0b8323ae06dc5b901fca8f936e57c2d pnpm test:ci`: `ENV_ENSURE=PASS mode=bootstrap`; `PROTO_BREAKING=PASS`; complete build inventory `22/21/23/5`; tooling 40/40; assigned unit `packages=8 suites=435 tests=1952`; Collaboration Runtime 67/67; foundation atomic group 5/5; L2 `packages=18 suites=59 tests=185`; `DATABASE_ROLLBACK=PASS`; exit 0.
- Same-worktree `pnpm test:l2` rerun: `ENV_ENSURE=PASS mode=check`; L2 `packages=18 suites=59 tests=185`; `DATABASE_ROLLBACK=PASS`; exit 0. No ignored environment file was rewritten.
- `pnpm test:design-gap`: 29/29 and the explicitly named expected-failure lane executed; exit 0.
- Final readback: root `.srl` residue 0, tracked generated/cache additions 0, task containers 0, volumes 0, networks 0, dependency ancestry PASS, `git diff --check` PASS.

Feature Review result: `FL_ACCEPT`. All six feature acceptance statements are mapped to exact clean-worktree evidence; stable semantics remain unchanged and the CRM route remains a named Stage `DESIGN_GAP`.

Independent Global RI result on `285bfb0a81fba5c1984815afdda7c654f58b1451`: `GLOBAL_RI_ACCEPT findings none`. This append-only packet transition changes no product, test, workflow, or runtime input; the same RI performs an affected readback on the resulting packet-only candidate before publication binding.

### Design gap preserved for Stage routing

The CRM Collaboration delegated-write route remains a stable-semantic conflict recorded by the parent Stage Lead. This feature does not alter Permission, Auth, Collaboration, or CRM authority semantics. The candidate preserves a fail-closed, explicitly named, always-executed expected-failure lane so required CI proves the current rejection instead of hiding it. Stage business-journey selection must avoid treating that route as an accepted success path until canonical design resolves the conflict.

## Remote state

Draft PR `#31` remains open for `codex/feature/tests-ci`. Its previously accepted head was `10213ad967ab5563c67e66e23709c3f5ac00dd25`; main merge and cleanup remain unauthorized.

## Moving-main refresh after FL-4 merge

Latest canonical main `3fef3227bfb11c976e3bf4ad863e998b9e082701` was integrated append-only with the prior accepted candidate as first parent. The affected-test matrix distinguishes the newer FL-4 Compose/APISIX inputs, the overlapping root command surface, current Collaboration Runtime, and repository-wide CI inputs from unchanged FL-4 Gateway/event implementation blobs whose accepted live evidence remains reusable.

Refreshed owner results:

- `pnpm gateway:events:config`: `COMPOSE_CONFIG=PASS backendServices=21 totalServices=38`, workload trust bindings `22`, readiness targets `20`, APISIX routes `2`; exit `0`.
- `pnpm collaboration-runtime:check`: `134/134` tests and static checks pass; exit `0`.
- Proto lint/gen/breaking against exact `3fef3227bfb11c976e3bf4ad863e998b9e082701`: pass; exit `0`.
- FL-4-dependent focused suites: Common event/NATS `35/35`, Gateway readiness `5/5`, Collaboration outbox/runtime `6/6`, Notification retry/DLQ/replay `8/8`; exit `0`.
- Full `pnpm test:ci`: environment reuses the exact task binding, all `21` Prisma clients generate, complete build inventory `22/21/23/5` passes, unit matrix `8` packages / `435` suites / `1,952` tests passes, Collaboration Runtime `134/134`, foundation atomic group `5/5`, L2 `18` packages / `59` suites / `185` tests, and `DATABASE_ROLLBACK=PASS`; exit `0`.
- `pnpm test:matrix:check`: unit packages `8`, L2 packages `18` / suites `59`; exit `0`.
- `pnpm test:design-gap`: `29/29`, including the named fail-closed CRM lane; exit `0`.
- Final readback: exact latest-main and prior-candidate ancestry pass; `git diff --check` passes; root `.srl`, changed generated/cache artifacts, owner processes, and task containers/volumes/networks are all `0`; owner tree is clean before this Packet-only freeze.

The CRM Collaboration OBO route remains the existing Stage `DESIGN_GAP`; no permission, token, service-boundary, data-ownership, gRPC/event, tenant/org/operator/trace, or audit semantic changed. The refreshed candidate now requires the same independent Global RI affected acceptance before Draft PR `#31` may be updated without force.
