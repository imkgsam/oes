# Gateway And Event Runtime

```text
featureKey: gateway-events
truthCommit: 8638401207d3d94fd3695e8d5e25deaf3e2a760a
integrationBase: 8638401207d3d94fd3695e8d5e25deaf3e2a760a
baseSha: 6a62c15b85f252ad3cd7ea19b67886148eb12ef0
dependencyCandidates:
  reproducible-build: 7a5df0a61315667e8966b4161f08b8fa71c7bd0c
  infrastructure-databases: 1b90f66ee3e007f2104cc795418ff50bea29895b
  trust-foundation: ee959bce07d7430291b676df587ca774039f6f0b
dependencyCompositionParents:
  - 1b90f66ee3e007f2104cc795418ff50bea29895b
  - ee959bce07d7430291b676df587ca774039f6f0b
integrationBranch: codex/feature/gateway-events
worktreeKey: gateway-events
pullRequest: pending
mergeSha: pending
cleanup: HOLD
state: RUNNING
```

## Objective

Make Gateway/BFF and the frozen event transport operationally reproducible from the exact build, infrastructure/database, and trust candidates. Gateway readiness must reflect its own serving state and required downstream availability; the APISIX path must prove real upstream health; Collaboration runtime dependencies must resolve through production module wiring; and a task-owned outbox -> NATS JetStream -> inbox route must prove publish/consume, idempotency, retry/backoff, DLQ, and controlled replay.

Stable service boundaries, service-owned data, internal gRPC, event-bus selection, event Code ownership, and tenant/org/operator/trace/audit semantics remain unchanged.

## Invariants

- External clients enter through APISIX and the API Gateway/BFF; Gateway does not become a second domain authority.
- Readiness returns ready only when Gateway is serving and every configured required dependency is ready; unavailable and misconfigured dependencies produce a non-ready response and status.
- APISIX route and upstream configuration use real task-owned health endpoints and do not convert transport failure into success.
- Collaboration production modules resolve their actual controllers, application services, repositories, gRPC clients, event publisher/consumer, and guards without test-only substitutions leaking into runtime.
- Each service writes its own outbox record in the same local transaction as its state change and each consumer owns its inbox/deduplication state.
- Delivery is at least once. Duplicate event IDs do not repeat effects; retries use bounded exponential backoff; exhausted or classified permanent failures enter DLQ; replay is explicit, audited, bounded, and preserves the original event identity.
- Applicable tenant, org, operator, trace, correlation/causation, and audit context survives the transport without trusting unverified payload/header overrides.
- All runtime and evidence resources are task-owned and local. Production/shared data, new secrets, host/system privilege, cross-owner writes, main merge, and cleanup stay protected.

## Slices

### GE-1 — Reproduction, inventory, and validation route

```text
state: RUNNING
candidate: pending
review: self
```

- Scope: reproduce static Gateway readiness, APISIX/upstream health gaps, Collaboration production DI failures, and event transport success/duplicate/failure/recovery gaps against the exact dependency composition.
- Dependencies: all three exact dependency candidates and composition `6a62c15b85f252ad3cd7ea19b67886148eb12ef0`.
- Acceptance: each symptom has a literal command/output/exit status, root-cause classification, bounded repair, and mapped verification layer.

### GE-2 — Real Gateway readiness and APISIX path

```text
state: READY
candidate: pending
review: local-ri
```

- Scope: replace fixed readiness content with fail-closed, timeout-bounded dependency probes; version task-owned APISIX route/upstream verification with real health transitions.
- Dependencies: GE-1, infrastructure-databases, trust-foundation.
- Acceptance: healthy Gateway/upstreams return ready; unavailable, slow, malformed, or misconfigured required upstreams return non-ready; APISIX routes a real request only to a healthy Gateway and reports outage/recovery without stale success.

### GE-3 — Collaboration production DI and runtime wiring

```text
state: READY
candidate: pending
review: local-ri
```

- Scope: close missing or inconsistent Collaboration module providers/imports/exports and exercise the actual production module graph with bounded external adapters.
- Dependencies: GE-1, trust-foundation.
- Acceptance: production modules compile and initialize; required dependencies resolve exactly once; circular/missing provider and fail-closed credential cases are asserted; teardown releases resources.

### GE-4 — Outbox, JetStream, inbox, failure, and replay

```text
state: READY
candidate: pending
review: local-ri
```

- Scope: version the task-owned publish/consume path and repair only missing transport/runtime mechanics required by the frozen contracts: transactional outbox claiming, CloudEvents publication, durable consumption, inbox idempotency, retry/backoff, DLQ, and controlled replay.
- Dependencies: GE-1, infrastructure-databases, trust-foundation.
- Acceptance: success, duplicate, temporary failure then recovery, permanent/exhausted failure, DLQ inspection, controlled replay, and process restart are deterministic; original event identity and trusted context are preserved; duplicate/replay effects remain one.

### GE-5 — Atomic task-owned verification driver

```text
state: READY
candidate: pending
review: self
```

- Scope: provide one versioned driver that starts only required task-owned dependencies, exercises Gateway/APISIX/Collaboration/event transitions, emits literal evidence, and tears down the exact resources it created.
- Dependencies: GE-2, GE-3, GE-4.
- Acceptance: clean execution is repeatable, fail-fast, collision-safe, contains no credential value, records dependency/candidate fingerprints, and leaves no live task resource after its bounded teardown.

### GE-6 — Feature Review and frozen candidate

```text
state: READY
candidate: pending
review: global-ri
```

- Scope: map every acceptance criterion to static, focused unit, component, contract/integration, and failure/recovery evidence; freeze one complete candidate and immutable review bundle.
- Dependencies: GE-1 through GE-5.
- Acceptance: self-review and independent Global RI accept the exact candidate; only then may an exact parent-issued single-use profile/authorization publish the owner branch and independent Draft PR; required CI succeeds before `READY_FOR_STAGE_REVIEW`.

## Feature acceptance

1. Gateway readiness is real, timeout-bounded, and fail-closed for every configured required dependency; its response and HTTP status distinguish ready from non-ready without fixed `ok`/`pending` content.
2. A task-owned APISIX configuration routes through the real Gateway/upstream health chain and proves healthy, outage, and recovery transitions.
3. Collaboration production modules resolve and initialize their runtime graph with trusted gRPC clients and event components; focused tests cover missing-provider and teardown behavior.
4. One task-owned outbox -> JetStream -> inbox route proves publish and consume, one-effect duplicate handling, bounded retry/backoff, DLQ after permanent/exhausted failure, controlled replay, restart recovery, and preserved original event/trusted context.
5. Stable architecture and ownership are unchanged; all modifications stay within Gateway/APISIX, Collaboration runtime wiring, event transport mechanics, task-local scripts/tests, and this Feature Packet.
6. Every result is bound to the exact three dependency candidates and final candidate. Self-review, independent Global RI, independent Draft PR, and required CI precede Stage Review readiness.

## Validation route

- Static: architecture/contract comparison, APISIX render, dependency inventory, event subject/stream/durable/DLQ mapping, module graph, diff scope, dependency ancestry, and secret scan.
- Focused unit: readiness aggregation/timeouts, configuration rejection, outbox claim state transitions, retry schedule, failure classification, inbox duplicate/replay logic, and context preservation.
- Component: Gateway production module initialization; Collaboration production module initialization; real task-owned PostgreSQL and NATS JetStream adapters.
- Contract/integration: APISIX -> Gateway -> bounded upstream; transactional outbox -> JetStream -> durable consumer -> inbox, including duplicate, retry, DLQ, replay, and restart.
- Reliability: slow/down/malformed upstream, transient/permanent handler failure, publish interruption, consumer restart, exhausted retry, DLQ replay, resource collision, and exact teardown.
- Review: FL Feature Review, one independent read-only Global RI on exact candidate, Draft PR required CI, then parent SL Stage Review.

## Current evidence and blockers

- Handoff evidence is owner-local under the bound artifact root and stays out of stable documentation links.
- Capability smoke passed after the required `proto:gen` prerequisite: 67/67 collaboration-runtime tests, task-owned PostgreSQL CRUD, localhost, approved network, Git rollback, and evidence SHA readback succeeded.
- Blockers: none. Any stable semantic conflict found during GE-1 routes to `DESIGN_GAP`; none has been identified at packet creation.
