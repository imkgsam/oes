# Local NATS JetStream Event Bus Runbook

## Scope and boundary

This runbook operates the local P1 proof defined by [ADR 0013](../adr/0013-nats-jetstream-event-bus-and-delivery-semantics.md), [the event-bus architecture](../architecture/17-event-bus-and-outbox-architecture.md), and [the transport contract](../contracts/events/platform-transport.md). It is not a production deployment guide.

The local topology is one file-backed NATS JetStream node. Its `nats_jetstream_data` Docker volume survives container recreation. It provisions the following fixed resources:

| Resource | Subject/filter | Storage and retention | Capacity behavior |
| --- | --- | --- | --- |
| `OES_BUSINESS_EVENTS` | `oes.events.>` | file, one replica, limits retention, 7 days | 10 GiB; `discard=new` rejects publish when full |
| `OES_EVENT_DLQ` | `oes.dlq.>` | file, one replica, limits retention, 90 days | 5 GiB; `discard=new` rejects DLQ publish when full |
| `OES_EVENT_ADVISORIES` | `$JS.EVENT.ADVISORY.>` | file, one replica, limits retention, 7 days | 1 GiB; persisted topology/advisory evidence |
| `notification-service__collaboration-task__v1` | assigned, completed, and cancelled Collaboration Task subjects only | durable pull consumer, explicit ACK, five deliveries, frozen backoff | consumer progress is durable |
| `notification-service__dlq-inspection__v1` | `oes.dlq.notification-service.collaboration-task.v1` only | durable pull inspector, explicit ACK, one delivery | Notification can inspect only its own DLQ subject without broad stream reads |

The business stream uses the approved local seven-day development window. `OES_EVENT_REPLAY`, a replay ingress subject, and `CONTROLLED_REBUILD` are deliberately absent. A replay reads `OES_BUSINESS_EVENTS` through a separately approved, run-scoped consumer; it never republishes a CloudEvent.

## Credentials and access boundary

The base Collaboration, Notification, and operator credentials are approved deployment inputs, typically injected by the local secret manager or an untracked environment file. Every approved `SAFE_REDELIVERY` run additionally receives a short-lived Notification replay credential and an exact run ACL lease. Do not add passwords, the run ACL lease, or the approved filter/range to Git, Nacos, CloudEvents, DLQ records, shell history, or support tickets.

| Identity | Allowed purpose | Explicitly not allowed |
| --- | --- | --- |
| Collaboration publisher | publish the three frozen `oes.events.collaboration.task.*` subjects and receive its request replies | publish another context, read business events, manage JetStream |
| Notification consumer | pull the fixed durable, publish its consumer-specific DLQ record, and inspect it through `notification-service__dlq-inspection__v1` | wildcard business subscription, another consumer's DLQ, raw stream reads, JetStream topology changes |
| Notification replay run credential | make the read-only `$JS.API.INFO` capability query required by the shared client, then create, inspect, resume, ACK, and delete only the three run-bound consumers listed below | any other consumer name, Asset or other service subject, multiple-filter/general consumer create API, stream management, business/DLQ publish |
| Notification advisory recovery credential | subscribe only to Notification's exact MaxDeliver advisory and publish only its DLQ subject if a separately authorized, real source delivery is available | raw business-stream reads, source ACK/TERM, consumer management, wildcard advisory reads, or another consumer's DLQ |
| Platform operator | JetStream control-plane operations, advisory observation, DLQ inspection, and approved run-scoped replay setup | direct business-event or DLQ data publishing through broad core-subject access |

No `no_auth_user`, anonymous account, wildcard core-data permission, or shared application/operator credential exists. The broker protects subjects; tenant boundary validation, CloudEvent validation, Inbox idempotency, operator approval, and audit remain service-owned controls.

An advisory contains stream and consumer sequence references, but it does **not** contain the per-delivery ACK reply subject that JetStream requires for `TERM`. A retained `MSG.GET` read cannot recreate that token. Therefore the recovery credential deliberately has neither raw stream-read nor `$JS.ACK...` authority. On a MaxDeliver advisory, the target consumer must persist/alert an unresolved recovery record and fail closed; it must not publish a record that implies resolution, fabricate a TERM request, or terminate the source. The normal handler still performs publish-before-TERM while it holds a real delivery object.

NATS ACLs cannot inspect a multiple-filter consumer-create body. The NATS JetStream API exposes a filter in the create subject only for a **single** filter; a multiple-filter create uses the general API and would permit a filter/body escalation. Therefore this topology never grants Notification the general multiple-filter API. One approved run uses three run-bound pull consumers—one for each exact Collaboration subject—and the broker ACL pins each operation to the literal `CREATE`, `INFO`, `MSG.NEXT`, `ACK`, and `DELETE` subjects for those names. The only non-run-bound exception is read-only `$JS.API.INFO`, required before creation by the shared client; it does not expose messages or grant stream or consumer management. This is the least privilege that the NATS subject ACL can enforce without giving Notification operator or generic broker-management access.

| Run consumer | Required exact filter | Run ACL subject family |
| --- | --- | --- |
| `<run>__assigned` | `oes.events.collaboration.task.assigned` | `$JS.API.CONSUMER.{CREATE,INFO,DELETE,MSG.NEXT}.OES_BUSINESS_EVENTS.<run>__assigned...` and `$JS.ACK.OES_BUSINESS_EVENTS.<run>__assigned.>` |
| `<run>__completed` | `oes.events.collaboration.task.completed` | same family for `<run>__completed` only |
| `<run>__cancelled` | `oes.events.collaboration.task.cancelled` | same family for `<run>__cancelled` only |

## Bootstrap and readiness

1. Obtain the eight base deployment inputs outside the repository: `NATS_COLLABORATION_USER`, `NATS_COLLABORATION_PASSWORD`, `NATS_NOTIFICATION_USER`, `NATS_NOTIFICATION_PASSWORD`, `NATS_NOTIFICATION_RECOVERY_USER`, `NATS_NOTIFICATION_RECOVERY_PASSWORD`, `NATS_OPERATOR_USER`, and `NATS_OPERATOR_PASSWORD`.
2. Start only this lane and its bootstrap job:

   ```sh
   docker compose -f docker-compose.infra.yml up -d nats nats-bootstrap nats-advisory-monitor
   ```

3. Check readiness and bootstrap completion:

   ```sh
   docker compose -f docker-compose.infra.yml ps nats nats-bootstrap nats-advisory-monitor
   docker compose -f docker-compose.infra.yml logs nats-bootstrap
   curl --fail http://localhost:8222/healthz?js-enabled-only
   ```

4. With the platform operator credential injected in the current process, inspect the fixed topology:

   ```sh
   nats --server nats://localhost:4222 --user "$NATS_OPERATOR_USER" --password "$NATS_OPERATOR_PASSWORD" stream info OES_BUSINESS_EVENTS
   nats --server nats://localhost:4222 --user "$NATS_OPERATOR_USER" --password "$NATS_OPERATOR_PASSWORD" stream info OES_EVENT_DLQ
   nats --server nats://localhost:4222 --user "$NATS_OPERATOR_USER" --password "$NATS_OPERATOR_PASSWORD" consumer info OES_BUSINESS_EVENTS notification-service__collaboration-task__v1
   ```

The bootstrap is create-only and safe to rerun. It never edits existing stream or consumer state. Treat an existing topology that differs from the JSON manifests as drift: stop the affected workload, obtain approval, reconcile it explicitly, and record the action.

## Approved SAFE_REDELIVERY ACL bootstrap, validation, and revocation

Do this only after the Notification-owned job has rejected empty tenant/range, free-text identity, missing consumer-owner approval, missing platform approval, missing `platformApprovalRef`, `CONTROLLED_REBUILD`, or enabled external side effects. This deployment lane does not approve a replay and does not create a replay API.

1. Issue one run ID and three durable names using `notification-service__replay__<run-id>__assigned`, `...__completed`, and `...__cancelled`. The names must be unique, contain no `.`, `*`, `>`, whitespace, or path separator, and must be recorded in the Notification-owned local operations audit.
2. Inject `NATS_NOTIFICATION_REPLAY_USER` and `NATS_NOTIFICATION_REPLAY_PASSWORD` for that run. Render the fifteen exact permission inputs—`NATS_NOTIFICATION_REPLAY_{ASSIGNED,COMPLETED,CANCELLED}_{CREATE,INFO,DELETE,NEXT,ACK}_SUBJECT`—from the table above. Each input is an NATS configuration literal, so the stored value must retain surrounding single quotes; for example `NATS_NOTIFICATION_REPLAY_ASSIGNED_CREATE_SUBJECT` is `'$JS.API.CONSUMER.CREATE.OES_BUSINESS_EVENTS.notification-service__replay__<run-id>__assigned.oes.events.collaboration.task.assigned'`.
3. Recreate only NATS to load the short-lived run lease, then confirm the fixed topology remains healthy. The replay worker receives only this run credential; it must not receive the platform operator credential.

   ```sh
   docker compose -f docker-compose.infra.yml up -d --force-recreate nats
   docker compose -f docker-compose.infra.yml up -d nats-bootstrap nats-advisory-monitor
   docker/nats/verify-notification-replay-acl.sh
   ```

4. The Notification-owned job creates exactly three pull consumers through the single-filter `CONSUMER.CREATE` endpoints, each with the approved start sequence/time, bounded completion policy, and the matching exact subject. It resumes only those names through `INFO`/`MSG.NEXT`, calls the normal typed handler, keeps tenant filtering and Inbox idempotency in the service, and defaults `allowExternalSideEffects=false`. It never republishes a CloudEvent.
5. On completion, persist the job result/audit, delete the three exact consumers with the same run credential, rotate `NATS_NOTIFICATION_REPLAY_PASSWORD` to a value not supplied to any workload, replace the fifteen lease inputs with a new inert lease, and recreate NATS. This revokes the run credential even if a process retained its old password. If deletion or rotation fails, stop the replay worker, record the failed revocation, and escalate to the platform operator; do not reuse the lease for another run.

The validation script launches an isolated NATS server and proves the approved three creates and DLQ inspection succeed, while Asset filter creation, an unscoped consumer name, the general multi-filter API, broad stream management, cross-service DLQ publication, and Notification consumer listing are rejected. It contains only local validation credentials and creates no persistent topology.

## Restart and capacity rejection

Restarting the NATS container retains JetStream data because it uses `nats_jetstream_data`:

```sh
docker compose -f docker-compose.infra.yml restart nats
docker compose -f docker-compose.infra.yml up -d nats-bootstrap nats-advisory-monitor
```

If `OES_BUSINESS_EVENTS` reaches 10 GiB, JetStream rejects a new publish. This is intentional: the producer relay records a retryable failure, leaves the immutable event in its owner outbox, and alerts. Do not purge the business stream to make the error disappear. Reduce pressure, extend capacity through an approved topology change, or drain/reconcile the owner outbox after capacity is restored.

If the DLQ stream is full, the consumer must not ACK or TERM the original delivery. Restore DLQ capacity first; the original message and its retry/advisory evidence must remain recoverable. Do not turn `discard` into `old` as an emergency shortcut.

## Credential rotation

1. Schedule a local maintenance window; pause relays and consumers so no process uses a partially rotated credential.
2. Rotate one identity in the approved secret store and update the matching deployment input. Do not print either old or new values.
3. Recreate only NATS and its local support services so the server reads the new inputs:

   ```sh
   docker compose -f docker-compose.infra.yml up -d --force-recreate nats
   docker compose -f docker-compose.infra.yml up -d nats-bootstrap nats-advisory-monitor
   ```

4. Verify each identity only against its approved action. A Collaboration credential must fail to subscribe to `oes.events.>`; a Notification credential must fail to publish an unapproved event subject or list consumers; a replay credential must fail on Asset, wildcard/general consumer management, and an unscoped name; only the operator can inspect JetStream topology.
5. Resume workloads and retain the rotation reference in the deployment audit system.

This local password rotation intentionally has no overlap window. Production secret rotation requires independent identities, staged credentials, TLS, and audited IaC as described at the end of this runbook.

## Consumer recreation

Deleting the durable destroys its progress. It is never a way to replay historical events. First stop the Notification worker, capture `consumer info`, and obtain consumer-owner plus platform-operator approval. Recreate only after deciding whether the intended action is a new subscription (`DeliverNew`) or the separate SAFE_REDELIVERY process.

For an approved clean recreation, use the platform operator and the frozen manifest:

```sh
nats --server nats://localhost:4222 --user "$NATS_OPERATOR_USER" --password "$NATS_OPERATOR_PASSWORD" consumer rm OES_BUSINESS_EVENTS notification-service__collaboration-task__v1 --force
docker compose -f docker-compose.infra.yml run --rm nats-bootstrap
```

Start the Notification worker only after `consumer info` confirms the three exact filter subjects, `AckPolicy=Explicit`, `DeliverPolicy=New`, `MaxDeliver=5`, and the frozen backoff schedule.

## MaxDeliver, terminated delivery, and DLQ inspection

`nats-advisory-monitor` emits local log alerts for `MAX_DELIVERIES` and `MSG_TERMINATED`; `OES_EVENT_ADVISORIES` preserves the same advisory class for inspection. Follow both, because a restarted monitor cannot replace persisted evidence:

```sh
docker compose -f docker-compose.infra.yml logs -f nats-advisory-monitor
nats --server nats://localhost:4222 --user "$NATS_OPERATOR_USER" --password "$NATS_OPERATOR_PASSWORD" stream view OES_EVENT_ADVISORIES
nats --server nats://localhost:4222 --user "$NATS_OPERATOR_USER" --password "$NATS_OPERATOR_PASSWORD" stream view OES_EVENT_DLQ
```

When an advisory names the Notification durable, preserve the advisory and original sequence in a Notification-owned unresolved recovery record and alert the consumer owner. The advisory recovery credential cannot—and must not attempt to—read the original body or TERM the source: JetStream supplies no source delivery token in an advisory. A deterministic consumer-specific DLQ record may be published before TERM only in a normal handler path or another broker-supported path that holds a real delivery object. If that authority is unavailable, the state remains unresolved; do not ACK, TERM, or claim DLQ resolution.

Inspect DLQ payloads only with the platform operator or a separately approved consumer-owner operations credential. Redact payload and secret-bearing fields from incident tickets. Mutable resolution state, replay result, and operator audit belong to the target consumer database; no shared DLQ or replay-control database is introduced here.

## Expiry alert and authorized SAFE_REDELIVERY

Review stream age and unresolved DLQ records at least daily in local environments and alert before business events reach seven days or DLQ records reach 90 days. An unresolved record must be escalated and archived by its consumer owner before expiry; expiration is never a resolution.

SAFE_REDELIVERY is the only P1 replay mode. Before authorizing it, require a bounded `eventId`, event-type, time, or sequence filter; non-empty tenant scope; consumer owner approval; platform operator approval; platform approval reference; and `allowExternalSideEffects=false` unless a separately frozen contract says otherwise. Reject cross-tenant, unbounded, free-text-identity, or `CONTROLLED_REBUILD` requests.

The Notification-owned one-off replay job records its request and audit locally, then uses its approved short-lived run credential to create the three exact single-filter run-scoped consumers from the approved sequence or time. It invokes the normal typed handler and Inbox, preserves the original CloudEvent `id` and `time`, and never publishes to `oes.events.>`. Pause/resume uses those run-scoped durable progress records. This lane does not provide a replay API, a central replay worker, or a generic consumer-management credential.

## Production follow-on — not represented here

This Compose proof is not a production topology. The follow-on deployment owner must implement three file-backed JetStream nodes, business/DLQ replication factor three, TLS and client certificate or equivalent production credential management, capacity sizing and backups, network policy, alert routing, IaC-controlled bootstrap/drift checks, staged secret rotation, and tested restore/upgrade procedures. Do not infer any of those controls from this single-node, local-password configuration.
