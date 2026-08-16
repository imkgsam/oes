# Event Bus / Outbox P1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. This packet is a planning artifact; it does not authorize implementation by this thread.

**Goal:** Deliver one black-box verified public-event slice: Collaboration Task assigned/completed/cancelled facts through a service-owned transactional outbox and NATS JetStream into a Notification service-owned inbox and typed local notification handler.

**Architecture:** Keep business state, audit, and outbox atomic inside the Collaboration database transaction. A Collaboration-owned relay publishes immutable CloudEvents to the shared OES_BUSINESS_EVENTS stream; a Notification-owned durable pull consumer applies an Inbox/idempotency transaction and creates only Notification-owned local results. Common provides provider-neutral CloudEvents, ports, validation, and NATS adapter capabilities without owning business payloads.

**Tech Stack:** TypeScript monorepo, NestJS services, PostgreSQL/Prisma per service, @oes/common, CloudEvents 1.0 Structured JSON, NATS JetStream, OpenTelemetry context propagation, and the existing Docker Compose local infrastructure.

---

```
featureKey: event-bus-outbox-p1
featureStatus: IMPLEMENTATION_PLANNING_READY
businessSlice: collaboration.task.assigned/completed/cancelled -> notification-service
```

## 1. 目标

- 将三个已冻结的 Collaboration 公共事实事件接入真实跨服务可靠投递链路：

  ```text
  Collaboration Task command
    -> same local transaction: Task + local audit + public outbox
    -> Collaboration-owned relay
    -> NATS JetStream OES_BUSINESS_EVENTS
    -> Notification durable pull consumer
    -> Notification local Inbox + typed local notification result
  ```

- 证明 at-least-once、consumer 幂等、有限重试、consumer-specific DLQ、受控 replay、tenant/trace/ACL 边界和恢复语义。
- 让 producer 与 consumer 都引用同一个 @oes/common Collaboration event code contract；业务 payload 仍由 Event Catalog 和 collaboration-service event contract 拥有。
- 先完成可在单节点本地环境运行的垂直切片；生产三节点、Asset 链路和后续事件分别进入独立实现任务。

## 2. 明确不做什么

- 不在本 packet 实现 Asset producer 或 Site consumer。Asset 事件契约对齐已经完成，但 Asset 业务链路仍须独立通过 common contract、服务实现和黑盒门禁。
- 不实现 asset event 的 src/common/src/contracts/asset_service/events.ts；该文件归 Asset owner 的后续实现 lane。
- 不把 collaboration.task.created/updated/started/reopened/archived/unarchived 或 due-soon/overdue/reminder 事件发布到公共业务流。
- 不把 MES 本地 outbox 迁移为公共事件，不接入 Terminal Device Redis Pub/Sub，不建设跨服务异步 command lane。
- 不实现订单、支付、库存或履约 Saga；Saga/Workflow 只消费或组合已经成立的事实和同步 command。
- 不建立共享 Outbox/Inbox 数据库、中央 outbox 扫描器、全局总顺序、无限重试或无授权全量 replay。
- 不引入 Schema Registry、平行 JSON Schema 目录、AsyncAPI codegen 或新的 event-contract package。
- 不在事件中增加 Event Catalog 未冻结的业务字段，不把 Task 内部实体、description、凭证、storage key 或完整 operator context 放进事件。
- 不把 Notification 外部 Email/SMS provider 调用放在事件 handler 的长数据库事务内；本 slice 只验证 Notification-owned local result。

## 3. 上游真相源与依赖

- architecture:
  - Event Bus 与 Outbox / Inbox 架构: /Users/acehood/Documents/GitHub/oes/docs/architecture/17-event-bus-and-outbox-architecture.md
  - Notification architecture: /Users/acehood/Documents/GitHub/oes/docs/architecture/08-notification-architecture.md
  - Collaboration service truth source: /Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md
  - Service truth-source index: /Users/acehood/Documents/GitHub/oes/docs/architecture/services/index.md
- contracts:
  - Event Catalog rules: /Users/acehood/Documents/GitHub/oes/docs/contracts/events/README.md
  - Event Catalog index: /Users/acehood/Documents/GitHub/oes/docs/contracts/events/catalog.md
  - Collaboration event contract: /Users/acehood/Documents/GitHub/oes/docs/contracts/events/collaboration-service.md
  - Platform transport contract: /Users/acehood/Documents/GitHub/oes/docs/contracts/events/platform-transport.md
  - Asset event contract, aligned but out of this slice: /Users/acehood/Documents/GitHub/oes/docs/contracts/events/asset-service.md
- adr:
  - ADR 0013: NATS JetStream and delivery semantics: /Users/acehood/Documents/GitHub/oes/docs/adr/0013-nats-jetstream-event-bus-and-delivery-semantics.md
  - ADR 0014: CloudEvents and service-owned common contracts: /Users/acehood/Documents/GitHub/oes/docs/adr/0014-cloudevents-and-service-owned-event-code-contracts.md
- prior design context, not a substitute for a service truth source:
  - Notification design workspace: /Users/acehood/Documents/GitHub/oes/docs/plans/designs/notification-service-design.md
  - Notification foundation plan: /Users/acehood/Documents/GitHub/oes/docs/plans/notification-service-foundation-plan.md

## 4. 当前冻结结论

- Public body is CloudEvents 1.0 Structured JSON with media type application/cloudevents+json; specversion and OES business oeseventversion remain separate.
- Event type is mapped to oes.events.<eventType>; version is not embedded in the subject.
- Production topology is a file-backed, three-replica JetStream cluster; the first implementation verification uses a file-backed single-node local topology with a persistent volume.
- OES_BUSINESS_EVENTS captures oes.events.>; OES_EVENT_DLQ is the separate operational DLQ stream. P1 does not provision OES_EVENT_REPLAY; replay reads the retained business stream through a run-scoped consumer.
- Durable consumers are pull-based, explicit-ack, MaxDeliver=5, DeliverNew, and filtered to exact approved subjects. Notification’s first durable name is `notification-service__collaboration-task__v1`.
- Relay publication is immutable: it sends the stored CloudEvent body as-is, uses Nats-Msg-Id = CloudEvents id, waits for JetStream acknowledgement, and only then marks the local outbox published.
- Inbox uniqueness is (consumerName, eventId); an equivalent duplicate is acknowledged without a second local side effect, while an identity/body-digest conflict is DLQ’d.
- Same-aggregate ordering is a consumer freshness concern; the platform promises no global total order. The Collaboration Task events in this slice do not gain invented ordering fields.
- Retryable, non-retryable, and poison-event handling follows the transport contract. A handler that holds a real delivery must receive DLQ publish acknowledgement before TERM; a MaxDeliver advisory has no source TERM token, so advisory-only recovery persists/alerts `UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED` rather than fabricating a DLQ/TERM resolution.
- P1 replay is target-consumer, tenant-scoped, range-scoped, dual-authorized SAFE_REDELIVERY. For Notification it uses exactly `notification-service__replay__<runId>__assigned|completed|cancelled`, one single-subject durable per frozen Task subject; CONTROLLED_REBUILD requires a later consumer-owned design freeze; replay never republishes to oes.events.> or creates a new event identity.
- tenantId is required for business isolation; actorAccountId is attribution only; signed operator context is not propagated as a downstream authorization token; traceId plus W3C traceparent/tracestate are preserved.

## 5. 契约真相位置

### 5.1 Business event code contract

The Collaboration contract lane creates and owns:

```
src/common/src/contracts/collaboration_service/events.ts
```

and re-exports it through:

```
src/common/src/contracts/collaboration_service/index.ts
```

The code contract contains only the three frozen event type/version/owner descriptors and their frozen data payload types. It must not expose TaskEntity, Prisma models, notification rules, or handler logic. The existing src/common/src/contracts/index.ts remains the common contract barrel; no parallel src/common/src/contracts/events/<service>/ tree is permitted.

The Asset code contract is a separate owner deliverable and is not part of this slice:

```
src/common/src/contracts/asset_service/events.ts
```

### 5.2 Platform code contract

The Foundation Platform lane creates provider-neutral common APIs under:

```
src/common/src/events/cloud-events/**
src/common/src/events/contracts/**
src/common/src/events/outbox/**
src/common/src/events/inbox/**
src/common/src/events/consumer/**
src/common/src/events/nats/**
src/common/src/events/operations/**
src/common/src/events/index.ts
```

The exact exported symbol names are an implementation concern subject to common API review. The black-box boundary is fixed: application code supplies a frozen contract, aggregate identity, verified context, and data; the common layer validates and builds the canonical CloudEvent, while service-owned adapters persist and consume it.

## 6. Lane DAG and ownership

```
EV-1 Common API / codec / ports -> EV-2 Collaboration common contract -> EV-4 Collaboration outbox / relay
                |                                                       |
EV-3 NATS topology / ACL / advisory monitoring -------------------------+
                |
EV-0 Notification truth / contract gate + EV-1 + EV-2 + EV-3 -> EV-5 Notification consumer
EV-1 + EV-3 + EV-5 -> EV-OPS consumer-owned DLQ / advisory recovery / replay job
EV-4 + EV-5 + EV-OPS -> EV-6 Integration & black-box acceptance
```

| Lane   | Owner group / role                                                                      | Allowed write paths                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Depends on                                              | Required output                                                                                                                                          | State                     |
| ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| EV-0   | Notification service design/contract owner                                               | docs/architecture/services/notification-service.md, docs/contracts/notification-service/\*\*, and a Notification-owned feature packet when required                                                                                                                                                                                                                                                                                                                             | Existing Notification architecture and design workspace | Unique service truth source plus a minimal frozen contract for the event-to-local-notification input and local result; no free-form rule/payload mapping | BLOCKER_NOW               |
| EV-1   | Foundation Platform / common implementation owner                                       | src/common/src/events/\*\*, src/common/src/index.ts, src/common/package.json, common event tests; pnpm-lock.yaml only through the designated dependency owner                                                                                                                                                                                                                                                                                                                   | Frozen architecture, ADR 0013/0014, transport contract  | CloudEvents codec, validation, Outbox/Inbox/consumer ports, NATS adapter, retry/DLQ/advisory/replay runner, normalized outcomes, trace hooks             | PENDING                   |
| EV-2   | Collaboration Contract / producer owner                                                 | src/common/src/contracts/collaboration_service/events.ts, src/common/src/contracts/collaboration_service/index.ts, contract-focused tests                                                                                                                                                                                                                                                                                                                                       | Event Catalog and EV-1 public types                     | Compiled contract imported by both producer and consumer; no business semantic drift                                                                     | PENDING_AFTER_EV1         |
| EV-3   | Deployment / SRE                                                                        | docker-compose.infra.yml, new docker/nats/\*\*, new docs/runbooks/event-bus-nats.md; no service business code                                                                                                                                                                                                                                                                                                                                                                   | ADR 0013, platform transport contract                   | Local JetStream, persistent volume, business/DLQ topology, exact consumers, advisory persistence/monitoring, ACL and credential runbook                  | PENDING                   |
| EV-4   | Collaboration service producer owner                                                    | src/services/system/collaboration-service/prisma/**, src/services/system/collaboration-service/src/application/**, src/services/system/collaboration-service/src/infrastructure/events/**, src/services/system/collaboration-service/src/infrastructure/audit/**, src/services/system/collaboration-service/src/infrastructure/prisma/**, src/services/system/collaboration-service/src/modules/collaboration-task.module.ts, src/services/system/collaboration-service/test/** | EV-1, EV-2; local database availability from EV-3       | Task + audit + outbox atomicity, service-owned relay, typed producer, retry/quarantine behavior, producer tests                                          | PENDING_AFTER_EV1_EV2     |
| EV-5   | Notification service consumer owner                                                     | src/services/system/notification-service/prisma/**, src/services/system/notification-service/src/application/**, src/services/system/notification-service/src/infrastructure/events/**, src/services/system/notification-service/src/infrastructure/inbox/**, src/services/system/notification-service/src/infrastructure/prisma/**, src/services/system/notification-service/src/modules/notification/notification.module.ts, src/services/system/notification-service/test/** | EV-0, EV-1, EV-2, EV-3                                  | Exact-subject durable consumer, typed handler, local Inbox and notification result atomicity, duplicate/conflict/stale handling, consumer tests          | BLOCKED_BY_EV0            |
| EV-OPS | No standalone runtime; Foundation common + Deployment/SRE + Notification consumer owner | src/common/src/events/operations/**; docker/nats/** and docs/runbooks/event-bus-nats.md through EV-3 owner; src/services/system/notification-service/src/infrastructure/events/operations/**, src/services/system/notification-service/prisma/**, src/services/system/notification-service/scripts/\*\* through Notification owner                                                                                                                                              | EV-1, EV-3, EV-5                                        | Shared implementation mechanism plus Notification-owned DLQ resolution/advisory recovery/replay job and audit; no central operations database or service | PENDING_AFTER_EV1_EV3_EV5 |
| EV-6   | Integration & Verification owner                                                        | scripts/local/event-bus-collaboration-notification-smoke.mjs, scripts/local/event-bus-collaboration-notification-smoke.spec.mjs, narrowly scoped verification fixtures; no producer/consumer domain files                                                                                                                                                                                                                                                                       | EV-3, EV-4, EV-5, EV-OPS                                | Black-box fault and recovery evidence plus structured acceptance handoff                                                                                 | PENDING_AFTER_EV_OPS      |

## 7. Lane execution details

### EV-0: Notification truth and contract gate

The current service index marks notification-service as MISSING, while the existing Notification architecture and design workspace describe a broader P1 than the current runtime implements. Before a consumer worker writes a schema or handler, the Notification owner must:

- extract the service’s long-term boundary into docs/architecture/services/notification-service.md;
- freeze the minimal event-to-local-notification input and output semantics in docs/contracts/notification-service/\*\*;
- state whether this slice creates an in-app notification item, a durable local task, or both, without allowing the Event Bus packet to invent the model;
- freeze the predefined Task event recipient/notification mapping and its tenant boundary; arbitrary administrator-configured payload paths are outside this packet;
- define the Notification-side transaction boundary: Inbox identity record plus local notification result in one local database transaction;
- define the Notification-side replay safety rule, including whether the handler is SAFE_REDELIVERY capable and whether external side effects are disabled for this slice.

This gate does not change the three Collaboration event payloads. If the gate is not accepted, EV-5 and EV-6 remain blocked; EV-1 through EV-4 may still be developed against typed ports and test doubles.

### EV-1: Common platform API, codec, ports, and adapter

The implementation owner should use TDD in this order:

- [ ] Add codec tests for canonical CloudEvents Structured JSON, required attributes, OES extension casing, stable dataschema, application/cloudevents+json, body-size rejection, and body immutability.
- [ ] Add validation tests for owner/type/version mismatch, missing tenant, missing trace identity, aggregate identity mismatch, duplicate required headers, subject/body mismatch, and unsupported major version.
- [ ] Add Outbox/Inbox/consumer port contract tests for ACKNOWLEDGED, RETRYABLE_FAILURE, QUARANTINED_FAILURE, APPLIED, DUPLICATE, STALE_IGNORED, NON_RETRYABLE_FAILURE, and EVENT_ID_CONFLICT.
- [ ] Add NATS adapter tests for exact subject mapping, required headers, Nats-Msg-Id, explicit acknowledgement, delayed retry/backoff, max-delivery advisory recovery, and run-scoped replay consumers.
- [ ] Expose the reviewed common API through @oes/common/events; do not make application code import a NATS client or broker delivery type.
- [ ] Add the NATS client dependency only to the package that owns the adapter, update the lockfile through its single writer, and keep credentials/configuration outside source control.

The lane must not define Collaboration payload fields. Its descriptor API consumes an owner-provided contract and validates it.

### EV-2: Collaboration compiled event contract

- [ ] Translate exactly the three Event Catalog contracts into src/common/src/contracts/collaboration_service/events.ts.
- [ ] Export the contract from the existing Collaboration contract barrel and preserve the existing generated gRPC exports.
- [ ] Add compile-time and runtime descriptor tests that prove producer and consumer receive the same type/version/data definition.
- [ ] Add a contract check that rejects embedded .v1 event type names and schema_version as substitutes for the frozen CloudEvents mapping.
- [ ] Do not add TaskCreated, TaskUpdated, TaskStarted, TaskReopened, TaskArchived, or TaskUnarchived as public contracts.

### EV-3: Local NATS topology, credentials, ACL, and runbook

The deployment lane owns the shared Compose edit and must keep it single-writer. The local topology must provide:

- one file-backed JetStream node and persistent volume in docker-compose.infra.yml;
- OES_BUSINESS_EVENTS over oes.events.> with local retention in the frozen 3–7 day development window;
- OES_EVENT_DLQ over oes.dlq.> with explicit bounded retention; P1 does not provision a central replay stream;
- the Notification durable pull consumer named `notification-service__collaboration-task__v1`, filtered to exactly the three Collaboration subjects;
- persistent monitoring/alerting for the Notification consumer’s MaxDeliver and terminated-message advisories;
- separate Collaboration publisher, Notification consumer, and platform operator credentials, with no anonymous full-access mode;
- ACLs that allow Collaboration to publish only its approved event subjects, Notification to consume only its approved subjects and create/read only its approved run-scoped replay consumer, and operators to manage DLQ/replay without granting business services operator powers;
- health/readiness checks and a runbook for bootstrap, restart, stream capacity rejection, credential rotation, consumer recreation, DLQ inspection, advisory recovery, and authorized run-scoped replay.

Production three-node/TLS/IaC is not silently represented by the local Compose file. The runbook must state the production requirements from ADR 0013 and identify the follow-on deployment owner.

### EV-4: Collaboration transactional outbox and relay

The Collaboration owner owns all database changes under its own Prisma directory. The implementation must replace the current sequential repository.save -> audit.record -> LocalTaskEventPublisher.publish path with a transaction-scoped outbox boundary:

- CreateTask for a non-self assignment: Task row, TASK_CREATED local audit, and the one public collaboration.task.assigned outbox row commit or roll back together. A self todo does not publish the assigned event.
- CompleteTask: Task state change, TASK_COMPLETED local audit, and the one public completed outbox row commit or roll back together; an idempotent already-completed command does not publish a new fact.
- CancelTask: Task state change, TASK_CANCELLED local audit, and the one public cancelled outbox row commit or roll back together; an idempotent already-cancelled command does not publish a new fact.
- Commands with no catalogued public fact keep their local audit atomicity but do not acquire a public event by implication.
- The common builder creates the canonical CloudEvent before the transaction commits; the outbox stores the immutable body and the producer does not reconstruct it in the relay.
- The outbox row carries the frozen semantic categories required by the architecture (identity, owner/type/version, tenant/aggregate, immutable body, publication state, attempt/backoff/error evidence, and publication acknowledgement time). Exact Prisma field names and migration SQL are owned by Collaboration implementation review and must not be copied into the packet as a second contract.
- The relay reads only Collaboration’s own database, claims rows with a bounded lease/equivalent concurrency control, publishes through the common adapter, marks published only after acknowledgement, and leaves retryable failures pending.
- Invalid contract, owner mismatch, unsupported version, oversize body, and deterministic encoding failures are quarantined and alerted rather than retried forever.
- Existing process-local event code may remain only for explicitly local behavior; it must not be used as cross-service delivery or as a second public outbox.

Required implementation/test paths are the existing task-command.service.ts, task audit/event ports and adapters, prisma/schema.prisma, the Task module wiring, new service-owned outbox/relay adapters, and focused L1/L2 tests. The owner must preserve existing Task command/query behavior outside this transaction boundary.

### EV-5: Notification Inbox and typed handler

After EV-0 freezes the local result contract, the Notification owner implements:

- an exact-subject durable pull consumer for `notification-service__collaboration-task__v1` using the three shared Collaboration event types;
- transport and contract validation before business handling, including tenant/source/type/version/subject/body digest checks;
- a local database transaction that inserts or verifies (consumerName, eventId) Inbox identity and creates the Notification-owned local result;
- equivalent duplicate delivery as DUPLICATE + ACK, identity/body mismatch as EVENT_ID_CONFLICT + reliable DLQ transfer, and supported owner-version staleness as STALE_IGNORED only where the Notification contract explicitly permits it;
- no Task query for reconstructing Task truth, no Task write-back, no use of actorAccountId as a delegated authorization credential, and no direct provider call while the Inbox transaction is open;
- a local worker/task boundary for any external delivery that the Notification contract later enables; this slice defaults external side effects off for replay and recovery tests;
- consumer-scoped metrics/log fields for eventId, tenantId, traceId, consumerName, event type/version, outcome, attempts, and DLQ/replay references without logging credentials or uncontrolled payloads.

The existing Email/SMS NotificationDispatch code is not automatically the target for in-app Task event handling. The Notification contract gate decides the local object and migration; the Event Bus packet only fixes the Inbox and delivery semantics.

### EV-OPS: Consumer-owned event operations

EV-OPS is a coordinated implementation lane, not a new service or independently deployed long-running worker:

- Foundation Platform implements reusable retry classification, DLQ record construction, publish-before-term for real deliveries, advisory parsing/fail-closed unresolved outcome, run-scoped replay consumer and operations audit helpers under `src/common/src/events/operations/**`; it does not create source TERM authority from an advisory.
- Deployment / SRE provisions the shared `OES_EVENT_DLQ` stream, per-consumer DLQ subjects/ACL, persistent advisory monitoring/alerts and the operational runbook under its EV-3 single-writer paths.
- Notification owns only its subscription operations under `src/services/system/notification-service/src/infrastructure/events/operations/**`, its own Prisma migration, and its own one-off replay/recovery scripts. For an advisory-only crash case it persists the advisory reference and `UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED`, alerts its consumer owner, tracks stream-expiry escalation, and records either `SAFE_REDELIVERY_COMPLETED` with `originalSourceTermination=NOT_PERFORMED` or `EXPIRED_UNRESOLVED`. It does not inspect or mutate another consumer’s records.
- Raw immutable messages and failure snapshots remain in JetStream only when a real delivery completed a DLQ transfer; mutable DLQ resolution, advisory-only unresolved state, replay request/result and operator audit remain in the target consumer’s own database. There is no shared DLQ/replay control database.
- P1 implements only `SAFE_REDELIVERY`. The service-local replay job creates a run-scoped consumer on `OES_BUSINESS_EVENTS`, uses exact event subjects plus approved sequence/time bounds, filters tenant after contract decoding, calls the same typed handler and relies on the normal Inbox for idempotency. It never republishes to `oes.events.>` and does not provision `OES_EVENT_REPLAY`.
- The replay entry is an operations-only one-off job/CLI, not an API Gateway business endpoint. It must receive trusted operator identity, target consumer owner approval and platform approval reference; free-text operator identity, empty tenant scope and unbounded replay are rejected.
- `CONTROLLED_REBUILD` is excluded until a real projection rebuild use case freezes a dedicated handler, checkpoint and side-effect policy.

EV-OPS is accepted only when: (a) an in-handler terminal failure proves DLQ publish acknowledgement before TERM for its real delivery; (b) a final-attempt handler crash produces one consumer-local `UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED` record, alert and expiry escalation without a fabricated DLQ/TERM; (c) an authorized replay uses exactly the three single-subject run durables and any terminal replay failure uses its own real delivery; (d) replay resumes from run-scoped progress, external side effects remain disabled by default, and cross-tenant/unauthorized operations fail closed.

### EV-6: Integration and black-box verification

The verification owner writes only harness/fixture code and evidence. It must not repair producer or consumer behavior in the harness. The smoke path must be runnable against the local Compose topology and isolated Collaboration/Notification databases.

## 8. Transaction, security, and operator boundaries

### 8.1 Local transaction boundaries

| Boundary              | Must be atomic                                                                                  | Must not be inside the boundary                                               |
| --------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Collaboration command | Task state + required local audit + corresponding public outbox body/state                      | NATS publish, Notification database, Email/SMS/CDN provider                   |
| Collaboration relay   | Outbox claim/update and provider acknowledgement bookkeeping                                    | Any consumer business write, any other service database                       |
| Notification consumer | Inbox identity/digest + Notification-owned local result                                         | Task mutation, gRPC round trip for current Task truth, external provider call |
| DLQ/replay operations | Target consumer local resolution/audit state plus JetStream DLQ or run-scoped consumer progress | Business state mutation, another consumer’s database, or payload rewriting    |

### 8.2 Tenant, identity, and trace

- Every CloudEvent has a verified oestenantid; tenant is rechecked by the consumer before Inbox write and is retained in Inbox/DLQ/replay metadata.
- source is the service identity, not an account identity. actorAccountId is an attribution snapshot only.
- No signed operator context, service credential, provider token, or long-lived secret enters a CloudEvent, NATS header, DLQ body, or replay request body.
- traceId remains the OES event correlation field. Valid traceparent/tracestate is propagated as transport metadata; the consumer creates a new async span linked to the producer.
- Local, test, staging, and production NATS accounts/credentials are isolated. Credentials are injected from deployment secrets; they are not committed or stored as plaintext Nacos configuration.
- Tenant isolation is enforced in service code and operations filters; the platform does not create a stream or subject per tenant.

### 8.3 Operator and replay authorization

- Every replay request names one consumer, one tenant scope, one bounded event filter, `SAFE_REDELIVERY`, a reason, the consumer owner approval, the platform operator approval, and a platform approval reference.
- A SAFE_REDELIVERY run uses a run-scoped JetStream consumer and may call the normal handler only after it is proven replay-safe; the normal Inbox remains the final idempotency boundary and external side effects default off.
- CONTROLLED_REBUILD is not implemented by this P1 and requires a later consumer-owned design freeze.
- DLQ records are consumer-specific and are not ordinary business events. Only platform operations and the target consumer owner can inspect, resolve, or replay them.

## 9. Acceptance matrix

| ID  | Black-box acceptance                                                                                                                                                                                                                                                | Evidence owner                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| A1  | A rejected Collaboration command leaves neither the Task mutation nor its audit/outbox side effects.                                                                                                                                                                | Collaboration + Integration     |
| A2  | A committed assigned/completed/cancelled command always has the corresponding immutable pending outbox body before the command returns.                                                                                                                             | Collaboration                   |
| A3  | NATS outage leaves pending outbox rows intact; recovery causes relay catch-up without a new business command.                                                                                                                                                       | Collaboration + Deployment      |
| A4  | Relay crash after JetStream acknowledgement and before outbox update may redeliver the same event identity but cannot create a second Notification local result.                                                                                                    | Collaboration + Notification    |
| A5  | A Notification restart resumes from the durable consumer progress and preserves Inbox idempotency.                                                                                                                                                                  | Notification + Integration      |
| A6  | Duplicate equivalent delivery ACKs without a second side effect; conflicting reuse of an event ID enters the target DLQ.                                                                                                                                            | Notification                    |
| A7  | Retryable failures follow bounded backoff; a poison event reaches the target consumer DLQ without blocking unrelated valid events.                                                                                                                                  | Common + Notification           |
| A8  | If the final delivery handler crashes, advisory recovery creates one idempotent consumer-local `UNRESOLVED_SOURCE_TERMINATION_AUTHORITY_REQUIRED` record, alerts and escalates before business-stream expiry, and proves no advisory-only retained lookup, DLQ publish, ACK or TERM occurs. A separately dual-authorized SAFE_REDELIVERY uses exactly three single-subject run durables; any DLQ transfer is publish-before-TERM for that new real delivery and the audit records `originalSourceTermination=NOT_PERFORMED`. | Common + Consumer + Integration |
| A9  | SAFE_REDELIVERY uses a run-scoped JetStream consumer, is tenant/consumer/range scoped, skips an equivalent Inbox record and never republishes to oes.events.>.                                                                                                      | Consumer + Integration          |
| A10 | Unauthorized cross-tenant replay, anonymous management, publisher namespace escalation, and consumer wildcard subscription fail closed and are audited.                                                                                                             | Deployment/SRE + Integration    |
| A11 | eventId, tenantId, traceId, ownerService, consumerName, and DLQ/replay references correlate across command, audit, outbox, NATS, Inbox, and local result logs.                                                                                                      | Common + Integration            |
| A12 | A body over the frozen hard limit is rejected before outbox commit; no malformed/quarantined event is published.                                                                                                                                                    | Common + Collaboration          |
| A13 | Common contract tests prove the producer and consumer import the same Collaboration events.ts; an embedded .v1 type or schema_version cannot pass.                                                                                                                  | Contract + Common               |
| A14 | Local single-node Compose runs publish, redelivery, consumer restart, DLQ, and authorized replay; production readiness remains separately evidenced for the three-node topology.                                                                                    | Deployment + Integration        |

## 10. Minimal verification strategy and integration order

1. **Documentation/contract gate:** validate links, catalog status, CloudEvents example, common-contract path, and absence of stale Asset gap language in the platform architecture.
2. **Common unit gate:** run only common event codec, descriptor, port, adapter, retry, and header tests; build @oes/common.
3. **Collaboration producer gate:** regenerate its Prisma client, run Task L1, run focused L2 transaction tests against the Collaboration database, and prove rollback/outbox persistence independently of NATS.
4. **Notification consumer gate:** after EV-0, regenerate its Prisma client, run typed handler/inbox L1 tests, and run focused L2 duplicate/conflict/restart tests against the Notification database.
5. **Topology gate:** start only the repository’s local infrastructure Compose plus the NATS service, bootstrap streams/consumers/ACL, and prove readiness before starting service workers.
6. **Cross-service smoke gate:** run scripts/local/event-bus-collaboration-notification-smoke.mjs for one tenant and one assigned Task, then exercise completed/cancelled facts and the failure matrix.
7. **Review/integration gate:** inspect the complete diff for shared-path collisions, verify no producer/consumer imports NATS client types, verify no local EventEmitter/Redis Pub/Sub is used for this public slice, and record accepted evidence in the structured handoff.

Expected command families for an implementation worker are:

```text
pnpm --filter @oes/common build
pnpm --filter collaboration-service prisma:generate
pnpm --filter collaboration-service test:l1
pnpm --filter collaboration-service test:l2
pnpm --filter notification-service prisma:generate
pnpm --filter notification-service build
docker compose -f docker-compose.infra.yml config
docker compose -f docker-compose.infra.yml up -d
node scripts/local/event-bus-collaboration-notification-smoke.mjs
git diff --check
```

The exact database migration command remains service-owned because Collaboration and Notification currently have schema-only Prisma directories with no shared migration history. Each owner must add and verify its own migration path; neither service may use the other service’s database or migration directory.

## 11. Blockers and dependency ledger

| Item                                                                                                                                                                                            | Class                               | Impact                                                                                                                                                                                 | Resolution owner / target                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Notification service has no unique docs/architecture/services/notification-service.md, and its event-to-local-notification P1 contract is still represented by an in-progress design workspace. | Blocker-Now                         | Blocks Notification schema, typed handler, and full end-to-end acceptance.                                                                                                             | Notification design/contract owner; EV-0.                                    |
| EV-OPS has no existing implementation yet, but its ownership/path is now frozen without a new runtime.                                                                                          | Blocker-Now for EV-6 implementation | EV-6 cannot claim complete DLQ/replay acceptance until common operations helpers, SRE advisory monitoring and Notification-owned operations module/job are implemented and integrated. | EV-OPS composite lane under the existing EV-1, EV-3 and EV-5 single writers. |
| package.json, pnpm-lock.yaml, src/common/src/contracts/\*, and several feature packet paths contain unrelated concurrent changes.                                                               | Blocker-Later                       | Shared-path writes can collide if lanes do not honor the single-writer table.                                                                                                          | The relevant shared-path owners coordinate writes and preserve unrelated changes. |
| Asset event business contract alignment is complete, but src/common/src/contracts/asset_service/events.ts and Asset/Site runtime paths are not in this P1.                                      | Blocker-Later                       | No impact on Collaboration -> Notification; blocks only Asset implementation.                                                                                                          | Asset owner handles the follow-on implementation.                            |
| Production three-node JetStream/IaC/secret rotation is not present in the repository.                                                                                                           | Blocker-Later for local P1          | Local single-node verification can proceed; production readiness cannot be inferred from Compose.                                                                                      | Deployment/SRE follow-on lane.                                               |

## 12. Protected shared files and sequencing rules

- src/common/src/index.ts, src/common/package.json, src/common/src/events/\*\*, and any common event export are single-writer Foundation Platform paths. Service owners may consume them but must not patch them to unblock themselves.
- src/common/src/contracts/index.ts and src/common/src/contracts/collaboration_service/index.ts are common contract barrels. The Collaboration Contract lane is the only writer for the Collaboration service event export; the Asset owner is the only writer for Asset event exports.
- pnpm-lock.yaml and root package.json are protected shared dependency/script paths. A dependency owner performs one coordinated update after the common API review; no service lane edits the lockfile opportunistically.
- docker-compose.infra.yml and docker/nats/\*\* are single-writer Deployment/SRE paths. Service lanes do not add NATS services, credentials, streams, or consumers in their own Compose files.
- src/services/system/notification-service/src/infrastructure/events/operations/\*\*, its service-local replay/recovery scripts and its Prisma operations records remain Notification-owner paths. Common or SRE lanes must not write them, and Notification must not create a cross-consumer control store.
- docs/contracts/events/\*\* is read-only for implementation lanes. Event Catalog/owner threads alone change business event semantics or status.
- docs/architecture/17-event-bus-and-outbox-architecture.md is the platform truth source; this packet records its current Asset status but implementation tasks must not rewrite it.
- docs/plans/features/event-bus-outbox-p1.md is the single feature status surface for this slice. Worker lanes report structured evidence; they do not create parallel packets or design workspaces.

## 13. 关闭条件

- EV-0 Notification service truth/contract gate is accepted, or the slice is explicitly narrowed to platform/producer-only planning without claiming end-to-end readiness.
- Common CloudEvents/ports/NATS adapter and the Collaboration events.ts contract build and pass focused tests.
- Collaboration command + audit + outbox atomicity is proven for assigned/completed/cancelled, including rollback and broker outage.
- Notification durable consumer + Inbox + typed local result is proven for applied, duplicate, conflict, retry, restart, and replay-safe outcomes.
- Local NATS topology has exact subjects, durable names, ACLs, bounded retention, persistent storage, and a reproducible runbook.
- EV-OPS common helpers, SRE advisory monitoring and Notification-owned DLQ/replay module/job have black-box evidence for real-delivery publish-before-TERM, advisory-only fail-closed unresolved recovery, alert/expiry escalation and run-scoped replay; no central service/control-store, fabricated source authority or “broker will handle it” assumption remains.
- EV-6 submits a structured handoff with changed paths, data/contract/security impact, conflicts, test evidence, and recommended next tasks.
- This packet does not create implementation tasks; Asset and production deployment enter implementation only after their respective gates are satisfied.

## 14. 下一步

Close EV-0 first, then create implementation tasks in this order:

```text
EV-1 Common platform API
  -> EV-2 Collaboration compiled event contract
  -> EV-3 local NATS topology (parallel with EV-2 after API review)
  -> EV-4 Collaboration transactional outbox + relay
  -> EV-5 Notification Inbox + typed handler (after EV-0)
  -> EV-OPS Common + SRE + Notification-owned operations integration
  -> EV-6 black-box acceptance and integration closure
```

No implementation task has been dispatched from this packet.
