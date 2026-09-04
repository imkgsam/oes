# Testing And CI

This document is the stable repository-wide testing and CI contract. It defines test meaning,
discovery, affected selection, execution environments, and the only authoritative CI topology.

## 1. Test taxonomy

Every executable test has exactly one primary risk class, expressed only by its filename suffix:

| Class | Required suffix | Boundary |
| --- | --- | --- |
| Unit | `.unit.spec.<ext>` | One function, class, or rule with no real external I/O. |
| Component | `.component.spec.<ext>` | Complete behavior inside one service or package; databases, message systems, and other services are fakes or stubs. |
| Contract | `.contract.spec.<ext>` | Producer/consumer compatibility for HTTP, gRPC, Proto, events, schemas, or other published boundaries. |
| Integration | `.integration.spec.<ext>` | One service connected to its required real database, NATS, filesystem, or adapter. |
| Journey | `.journey.spec.<ext>` | A critical business goal spanning a client or multiple real services. |

Static validation is not a test class. Formatting, lint, typechecking, build validation, and source
structure rules run through `check:static`. A file that mixes primary risks is split before it is
accepted into the inventory.

TypeScript and JavaScript packages use these locations:

- `<package>/src/**/*.unit.spec.<ext>`
- `<package>/src/**/*.component.spec.<ext>`
- `<package>/test/**/*.contract.spec.<ext>`
- `<package>/test/**/*.integration.spec.<ext>`
- `tests/cross-service/**/*.journey.spec.<ext>`

Android keeps its native Gradle source sets. The repository discovery adapter maps JUnit/Robolectric
classes to the same semantic classes without moving them out of the platform layout. Fixtures,
mocks, helpers, and snapshots never use a test suffix.

Plain `*.spec.*`, the former numbered layer directories, unknown suffixes, overlaps, and executable
tests without an owner fail discovery.

## 2. Inventory and ownership

The executable inventory is derived on every run; there is no fixed package or test whitelist.

- Type comes from the suffix.
- Owner comes from the nearest `package.json`, service package, or registered platform adapter.
- Code dependencies come from the pnpm workspace graph.
- A small versioned relationship table records only relationships that static dependency analysis
  cannot discover: Proto/event consumers, shared resources, serial groups, risk tags, and critical
  journeys.

The relationship table and discovery rules are validated as code. An unowned path, graph failure,
rule conflict, or anomalous empty selection yields `FULL_REQUIRED` rather than an optimistic result.

## 3. Change planning and affected selection

Change planning consumes the complete Git diff from an immutable base SHA to a candidate SHA,
including additions, modifications, deletions, and renames. It combines changed paths, the reverse
workspace dependency graph, and the cross-service relationship table.

The plan records changed paths, risks, affected owners, selected tests, and a reason for every
selection. Equal base SHA, candidate SHA, repository rules, and relationship hashes must produce an
identical plan.

Selection rules are:

- Contract changes select both producers and every registered consumer.
- Database, NATS, filesystem, migration, or adapter changes add the owning integrations.
- A changed path intersecting a critical cross-service chain adds its journey.
- A precise package lockfile change may remain scoped when its importers are resolvable.
- CI gate/discovery/selector/graph logic, global compiler/build/test runtime, shared database or NATS
  infrastructure, cross-system Auth/Permission/tenant/ExecutionToken behavior, destructive global
  Proto/event envelope or trust changes, unknown mapping, release, and explicit manual full requests
  require `FULL`.
- Ordinary single-service code, known non-global contracts, one service schema/migration, one package
  dependency, and test additions/deletions/renames do not require `FULL` by themselves.

Selector tests cover deletion, rename, shared libraries, lockfiles, Proto/event consumers, unknown
paths, and empty selections. A scoped success followed by a periodic full failure caused by an
omitted dependency is a selector defect.

## 4. Execution environments

Postgres, NATS, Compose networks, ports, data, and evidence paths are isolated by workflow job and run
identity. Versions are fixed. Every real-resource run performs readiness checks, unconditional
teardown, and a residue check. Execution is parallel by default; only a proven conflict appears in a
named `serialGroup`.

Browser journeys use repeatable headless Playwright automation. Android uses JVM and Robolectric for
ordinary feedback. Emulator validation runs only for Android-scoped, full, or release work. Physical
device qualification is a release activity and is not part of ordinary or periodic CI.

Infrastructure startup may use bounded retry. Assertion failures are never retried to convert a
failure into success.

## 5. Critical journey families and budgets

The current minimum families are:

1. Web login and authorization: Gateway to Auth, Identity, Permission, and Session Context.
2. PDA login and device admission: PDA BFF to Terminal Device, Auth, and Permission.
3. Task notification: Collaboration outbox to NATS and Notification Inbox.
4. Site publication: Site/Asset to Site Runtime and the public storefront view.
5. Public business card: Public Entry through ShortLink/BusinessCard to public view, vCard, and visit.

A real journey is created only for a production chain that exists and is executable. An unimplemented
stable-design step is reported as a gap; fakes do not make a cross-service chain complete.
The versioned current gap register and lower-class evidence map is
[`tests/cross-service/README.md`](../../../tests/cross-service/README.md).

- One browser/backend journey: at most 5 minutes.
- One Android emulator journey: at most 10 minutes.
- Scoped PR journey P95: at most 10 minutes.
- Full journey phase P95: at most 30 minutes.

Over-budget journeys are split, pushed down to a lower class, or given a faster environment before a
timeout is increased.

## 6. Source-structure validation

Executable tests do not read source text and use regular expressions as a substitute for runtime
behavior. True structure constraints use `check:static`, preferring AST, schema, Proto, or parsed
configuration checks. Runtime claims use Component, Contract, Integration, or Journey execution.
Assertions that freeze class names, whitespace, declaration order, implementation spelling, or proxy
performance/UI behavior have no regression value and are removed.

## 7. Authoritative CI topology

There is exactly one authoritative workflow and one required aggregate context:
`CI / Baseline Checks`.

Every event runs the Change Plan and final aggregate; conditional execution happens inside jobs so a
required workflow is never left pending because its entire workflow was path-skipped.

- `DOCS`: documentation formatting, links, and structure.
- `SCOPED`: affected static/build plus selected Unit, Component, Contract, Integration, and Journey
  tests.
- `FULL`: all static/build work, all five classes, critical journeys, and applicable security,
  migration, and rollback checks.

Pull requests use the computed profile. Merge Queue validates the exact combined result. A main merge
runs quick smoke and integrity validation. High-risk, release, explicit manual, and eligible periodic
runs use `FULL`.

The nightly trigger runs full validation only when main changed since the last successful full result
and at least seven days have elapsed; content-identical evidence may be reused. A pull-request change
that computes `FULL_REQUIRED` reports reason, scope, and estimated phases/cost, leaves the aggregate
blocked, and waits for explicit Human confirmation before expensive work. Nightly runs need no
per-run confirmation; a manual request is confirmation itself; a release that declares full
validation does not ask again.

## 8. Cutover and rollback

The taxonomy, discovery, selector, runner orchestration, workflow, and removal of the former numbered
layers are one atomic repository delivery. The migration must prove that every original test received
one disposition: keep, rewrite, merge, delete, or static conversion. Deletion requires replacement
risk coverage or a recorded finding that the test asserted no meaningful risk.

Critical bug regressions retain a pre-fix failure and post-fix pass. Permission, transaction, and
concurrency safeguards use focused mutation or fault injection to prove that their tests detect the
target failure.

The cutover is one revertible merge commit. A migration-caused post-main smoke failure, missing
required PR/merge-group check, demonstrated selector omission, or unreliable new CI execution triggers
preparation of an atomic revert. Merge and resource cleanup remain separate Human confirmations.
