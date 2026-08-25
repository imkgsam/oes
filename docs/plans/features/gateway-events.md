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
state: CANDIDATE_READY
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
state: CANDIDATE_READY
candidate: 90d778a8fa2851b55a01ad8049ae46c53457befe
review: self ACCEPT
```

- Scope: reproduce static Gateway readiness, APISIX/upstream health gaps, Collaboration production DI failures, and event transport success/duplicate/failure/recovery gaps against the exact dependency composition.
- Dependencies: all three exact dependency candidates and composition `6a62c15b85f252ad3cd7ea19b67886148eb12ef0`.
- Acceptance: each symptom has a literal command/output/exit status, root-cause classification, bounded repair, and mapped verification layer.

### GE-2 — Real Gateway readiness and APISIX path

```text
state: CANDIDATE_READY
candidate: 90d778a8fa2851b55a01ad8049ae46c53457befe
review: self ACCEPT
```

- Scope: replace fixed readiness content with fail-closed, timeout-bounded dependency probes; version task-owned APISIX route/upstream verification with real health transitions.
- Dependencies: GE-1, infrastructure-databases, trust-foundation.
- Acceptance: healthy Gateway/upstreams return ready; unavailable, slow, malformed, or misconfigured required upstreams return non-ready; APISIX routes a real request only to a healthy Gateway and reports outage/recovery without stale success.

### GE-3 — Collaboration production DI and runtime wiring

```text
state: CANDIDATE_READY
candidate: 90d778a8fa2851b55a01ad8049ae46c53457befe
review: self ACCEPT
```

- Scope: close missing or inconsistent Collaboration module providers/imports/exports and exercise the actual production module graph with bounded external adapters.
- Dependencies: GE-1, trust-foundation.
- Acceptance: production modules compile and initialize; required dependencies resolve exactly once; circular/missing provider and fail-closed credential cases are asserted; teardown releases resources.

### GE-4 — Outbox, JetStream, inbox, failure, and replay

```text
state: CANDIDATE_READY
candidate: 90d778a8fa2851b55a01ad8049ae46c53457befe
review: self ACCEPT
```

- Scope: version the task-owned publish/consume path and repair only missing transport/runtime mechanics required by the frozen contracts: transactional outbox claiming, CloudEvents publication, durable consumption, inbox idempotency, retry/backoff, DLQ, and controlled replay.
- Dependencies: GE-1, infrastructure-databases, trust-foundation.
- Acceptance: success, duplicate, temporary failure then recovery, permanent/exhausted failure, DLQ inspection, controlled replay, and process restart are deterministic; original event identity and trusted context are preserved; duplicate/replay effects remain one.

### GE-5 — Atomic task-owned verification driver

```text
state: CANDIDATE_READY
candidate: 90d778a8fa2851b55a01ad8049ae46c53457befe
review: self ACCEPT
```

- Scope: provide one versioned driver that starts only required task-owned dependencies, exercises Gateway/APISIX/Collaboration/event transitions, emits literal evidence, and tears down the exact resources it created.
- Dependencies: GE-2, GE-3, GE-4.
- Acceptance: clean execution is repeatable, fail-fast, collision-safe, contains no credential value, records dependency/candidate fingerprints, and leaves no live task resource after its bounded teardown.

### GE-6 — Feature Review and frozen candidate

```text
state: CANDIDATE_READY
candidate: 90d778a8fa2851b55a01ad8049ae46c53457befe
review: global-ri pending on exact packet-freeze HEAD
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

## Reproduced failures and formal repair

- Gateway readiness returned fixed `ok` and `downstream: pending`. A validated, timeout-bounded required-target inventory now probes all 20 configured gRPC sockets, returns 200 only when all are reachable, and returns 503 for missing, malformed, timed-out, or unavailable targets.
- Main Compose supplied neither an operational APISIX route nor complete event topology inputs. A digest-pinned standalone APISIX config, real Gateway health checks, exact Collaboration/Notification NATS mappings, NATS bootstrap ordering, and per-workload trust subpaths now make the path reproducible without sharing private keys across workloads.
- Collaboration had an outbox relay but no production lifecycle worker, while JSONB persistence and relay re-encoding could not preserve owner-produced CloudEvent bytes. A service-local overlap-safe worker and one bytea migration preserve exact encoded bodies from the command transaction through JetStream publication.
- Notification delayed-NAKed even on delivery five, so max-delivery failure never produced the consumer DLQ record required before TERM. The consumer now aligns to the frozen `max_deliver=5`, transfers validated exhausted deliveries before TERM, and NAKs when DLQ persistence fails.
- SAFE_REDELIVERY re-encoded events before Inbox digesting, validated only replay filters when resuming, and retained its three run durables after completion. The runtime now passes original bytes to the normal handler, validates the full immutable consumer definition, and deletes exactly the three completed-run consumers.

## Evidence keys

- handoff: `HANDOFF-SHA256SUMS`
- original reproduction and read-only architecture audit: `reproduction/SHA256SUMS`, `reproduction/event-runtime-audit.md`
- Compose and trust composition: `candidate-validation/gateway-events-config.log`, `compose-trust-bootstrap.log`, `compose-trust-subpath.log`, `compose-trust-rollback.log`
- Gateway and APISIX: `candidate-validation/gateway-readiness-test.log`, `candidate-validation/gateway-apisix-smoke.log`
- Collaboration and Notification focused runtime: `candidate-validation/collaboration-runtime-test.log`, `candidate-validation/notification-runtime-test-corrected.log`
- Common transport and all-backend build: `candidate-validation/common-events-build-test.log`, `candidate-validation/build-backend.log`
- full event route and rollback: `candidate-validation/gateway-events-runtime-smoke-final.log`
- static, formatting, secret, ownership, and residue checks: `candidate-validation/static.log`, `candidate-validation/format-corrected.log`, `candidate-validation/final-static-and-residue.log`

## Literal result summary

- `pnpm gateway:events:config` -> `COMPOSE_CONFIG=PASS backendServices=21 totalServices=38`; JSON reports `workloadTrustBindings=22`, `gatewayReadinessTargets=20`, `apisixRoutes=2`, `eventServicesWaitingForTopology=2`, `srmPort=50061`; exit 0.
- Gateway focused test -> 1 suite / 5 tests; healthy, unavailable, timeout, unsafe configuration, and real local socket paths pass; exit 0.
- APISIX smoke -> Gateway `200 -> 503 -> 200`, APISIX `200 -> 503 -> 200`, request ID present; exit 0.
- Collaboration runtime focused test -> 3 suites / 6 tests; production module credentials, exact-body relay, overlap/backoff, and awaited shutdown pass; exit 0.
- Notification focused test -> 2 suites / 7 tests; success, owner mismatch, DLQ publish failure, malformed/no-id fail-closed, transient retry, fifth-attempt DLQ-before-TERM, and replay raw-body wiring pass; exit 0.
- Common compiled event tests -> 2 suites / 34 tests; exact stored bytes, transport mismatch rejection, full replay consumer config, original-body delivery, and exact three-consumer deletion pass; exit 0.
- `pnpm build:backend` -> Proto generation, 21/21 Prisma clients, and root TypeScript project build pass; exit 0. `pnpm proto:lint` also exits 0.
- `pnpm gateway:events:smoke` -> 21 database migrations, exact outbox body digest and tenant/org/operator/trace/correlation/causation/audit preservation, broker and Inbox deduplication, transient publish recovery, validated fifth-attempt `NOTIFICATION_RETRY_EXHAUSTED` DLQ-before-TERM, separate `EVENT_OWNER_MISMATCH` DLQ-before-TERM, controlled replay `COMPLETED` with one effect and original body digest, three replay durables deleted, and `DATABASE_ROLLBACK=PASS`; exit 0.
- Final residue checks -> task-owned containers, volumes, and networks all absent; tracked-diff task credential scan records zero emitted values; `git diff --check` exits 0.

## Bounded design residuals

- Frozen documents require structurally malformed/no-id input to enter DLQ while the frozen DLQ identity requires the original `eventId` and forbids fabrication. The parent Stage Packet records this `DESIGN_GAP`. This candidate keeps malformed/no-id input fail-closed through delayed NAK/advisory observability and proves parseable owner/version/aggregate mismatch through DLQ-before-TERM; it does not claim malformed/no-id DLQ closure.
- The separate Asset -> Site route lacks the shared owner contract and complete topology/DLQ mechanics found by the read-only audit. The Stage owner explicitly bounded this feature to the representative Collaboration -> Notification route, so this candidate neither changes nor claims the Asset -> Site route.

## Feature Review

- Result: ACCEPT for implementation ancestor `90d778a8fa2851b55a01ad8049ae46c53457befe`; exact integration HEAD is the subsequent packet-freeze commit assigned to independent Global RI.
- Scope: all changes stay within Gateway readiness, APISIX/main Compose integration, Collaboration runtime/outbox, Common NATS transport mechanics, Notification delivery/replay, task-local scripts/tests, and this packet. Stable service ownership, gRPC/event choices, event owner contracts, and trusted context meanings are unchanged.
- Reliability: real healthy/outage/recovery, duplicate, transient retry, validated retry exhaustion, parseable permanent mismatch, DLQ publication failure, raw-body replay, exact durable cleanup, and exact resource teardown all have literal evidence.
- Evidence reuse: FL-1/2/3 ancestry and unaffected evidence remain valid. Shared Common changes triggered all-backend build; Compose changes triggered config/trust/APISIX checks; event runtime changes triggered the final full live matrix and teardown.
- Residual disposition: malformed/no-id and Asset -> Site are explicit bounded design/stage residuals and are excluded from completion claims; neither weakens the assigned representative acceptance route. Global RI must independently confirm this disposition on the exact packet-freeze HEAD.
- Remote: no push or PR mutation has occurred. Independent Global RI acceptance is required before the parent may issue one exact single-use remote profile/authorization.
