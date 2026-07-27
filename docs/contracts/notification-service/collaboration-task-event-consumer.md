# Collaboration Task Event Consumer Contract

```text
status: FROZEN
contractVersion: 1
lastUpdated: 2026-07-26
consumerService: notification-service
consumerName: notification-service__collaboration-task__v1
serviceTruthSource: docs/architecture/services/notification-service.md
```

## 1. Purpose and scope

本契约冻结 `notification-service` 对 Collaboration Task P1 三个公共事实的最小系统内通知反应。它只定义“已验证事件如何产生 Notification 自己拥有的本地结果”，不定义 Task、通用规则管理、外部投递或通知中心读取 API。

输入事件的 owner、payload、状态与兼容性以 [collaboration-service event contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/collaboration-service.md) 为准；consumer 必须使用 owner 的 `src/common/src/contracts/collaboration_service/events.ts` 编译期契约，而不是复制 payload interface。

## 2. Accepted input

| Attribute | Frozen value / rule |
| --- | --- |
| Event types | `collaboration.task.assigned`, `collaboration.task.completed`, `collaboration.task.cancelled` |
| Event version | `1` |
| CloudEvents source | `urn:oes:service:collaboration-service` |
| Aggregate | `TASK`; `subject` / `oesaggregateid` / `data.taskId` 必须一致 |
| Tenant | `oestenantid` required; it becomes the Notification local-result tenant boundary |
| Subscription | Exact subjects only: `oes.events.collaboration.task.assigned`, `oes.events.collaboration.task.completed`, `oes.events.collaboration.task.cancelled` |
| Delivery model | Durable pull + explicit ACK; platform semantics are defined by [platform-transport.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/platform-transport.md) |

`actorAccountId` is attribution only. It is never a delegated authorization token and is used here only to exclude self-notification.

## 3. Predefined handler mapping

This P1 has no generic `NotificationRule` lookup and no persisted minimal rule record. A Notification-owned predefined handler is the stable policy: no administrator can configure arbitrary payload paths, recipients, templates or deep links through this contract.

| Input event | Notification type | Candidate recipients | Exclusion / deduplication | Channel |
| --- | --- | --- | --- | --- |
| `collaboration.task.assigned` | `COLLABORATION_TASK_ASSIGNED` | `data.assigneeAccountId` | exclude `actorAccountId` | `IN_APP` |
| `collaboration.task.completed` | `COLLABORATION_TASK_COMPLETED` | `data.createdByAccountId` | exclude `actorAccountId` | `IN_APP` |
| `collaboration.task.cancelled` | `COLLABORATION_TASK_CANCELLED` | `data.createdByAccountId`, `data.assigneeAccountId` | exclude `actorAccountId`; deduplicate equal account IDs | `IN_APP` |

The mapping implements the accepted product behavior: assignees learn about newly assigned work; assigners learn that their assigned work completed; cancellation informs both assigner and assignee except the person who cancelled it. An empty recipient set is a valid local `NO_RECIPIENT` result, not a retryable failure.

## 4. Local result

For each resolved recipient, the handler creates exactly one `NotificationInboxItem`. An item is a Notification-owned snapshot, not a Task projection and not a command to `collaboration-service`.

| Local field / meaning | Frozen rule |
| --- | --- |
| `tenantId`, `orgId?` | copied from the verified event envelope; no cross-tenant resolution or reassignment |
| `recipientAccountId` | the resolved account from the predefined mapping; no group, role, watcher or contact lookup |
| `notificationType` | the predefined type in section 3 |
| `sourceEventId` | CloudEvents `id` |
| `sourceObjectRef` | `ownerService=collaboration-service`, `objectType=TASK`, `objectId=data.taskId` |
| `deepLinkRef` | `COLLABORATION_TASK_DETAIL(data.taskId)` symbolic reference; client/UI resolves its URL only in the current tenant and current authorized account context |
| `titleSnapshot` | copied from `data.titleSnapshot`; it is display input only, never the current Task title truth |
| `bodySnapshot` | rendered by a Notification-owned fixed template from an allowlisted subset: notification type, `titleSnapshot`, `dueAt?`, and the event’s terminal status/time where applicable |
| `templateKey`, `templateVersion`, `locale` | selected and snapshotted by the Notification-owned predefined handler. P1 uses its service-configured default locale and never accepts locale, rendered text, template version, recipient mapping or arbitrary variables from the event producer |
| lifecycle | initially unread/unarchived; read and archive semantics remain Notification-owned future API work |
| trace | stores source `eventId` and `traceId` for correlation |

The allowed rendering inputs are exhaustive. `description`, cancellation reason, Task internals, operator context, account contact data and arbitrary event JSON paths must not be copied to an InboxItem.

## 5. Transaction and idempotency boundary

The handler performs one Notification database transaction containing:

1. insert of `NotificationInboxEvent` with `(consumerName, eventId)` uniqueness, immutable identity tuple, canonical body digest, tenant, trace and local result;
2. creation of all resolved `NotificationInboxItem` records for that event, or the `NO_RECIPIENT` local result if none remain after actor exclusion.

The transaction succeeds as a unit or rolls back as a unit. It must not call Email, SMS, Push, a provider, `collaboration-service`, or another external system while open.

| Condition | Local / broker outcome |
| --- | --- |
| First valid delivery | `APPLIED`; ACK after the transaction commits. |
| Same `(consumerName,eventId)`, equivalent identity tuple and canonical digest | `DUPLICATE`; ACK, no new InboxItem. |
| Same `(consumerName,eventId)`, different identity tuple or canonical digest | `EVENT_ID_CONFLICT`; durably transfer to this consumer’s DLQ, create no new result, then terminate source delivery. |
| Unsupported version, owner/type/tenant/aggregate mismatch, malformed required value | `NON_RETRYABLE_FAILURE`; durably transfer to DLQ, create no local result. |
| Temporary local database/lock/transport failure | `RETRYABLE_FAILURE`; use bounded delayed redelivery. |

`tenantId` must be stored in the Inbox record and every local result. It is mandatory in consumer queries, DLQ filtering and replay authorization; a missing or mismatched tenant fails closed.

## 6. Ordering, stale data and replay

The three Task events do not expose an owner ordering/version field. This consumer therefore does not invent a stale comparison: every valid event is an independent notification fact, and `STALE_IGNORED` is not a Task P1 handler outcome. The consumer neither queries Task truth nor updates earlier notification items when a later Task event arrives.

This subscription is `SAFE_REDELIVERY` capable. A target-consumer, tenant-scoped, range-scoped and dual-authorized replay uses the same Inbox identity/digest check; its default is `allowExternalSideEffects=false`. Since this P1 creates only local InboxItems and never a `NotificationDispatch`, it has no external provider effect to replay.

## 7. EV-0 black-box acceptance

EV-0 is accepted when documentation and contract review can prove all of the following before EV-5 code starts:

1. `docs/architecture/services/notification-service.md` is the unique stable service truth and names `NotificationInboxItem` / `NotificationInboxEvent` as Notification-owned local objects.
2. The consumer imports the owner-provided Collaboration compiled event contract and subscribes only to the three exact frozen subjects.
3. Assigned produces one `IN_APP` item for the assignee; completed produces one for the assigner; cancelled produces items for assigner and assignee, with actor exclusion and recipient deduplication.
4. Every item preserves tenant, source event/object and symbolic Task-detail deep link, while template/locale/version and permitted content snapshots remain Notification-owned.
5. Inbox identity/digest and the complete local result commit atomically; equivalent duplicate does not create a second item and conflicting event-ID reuse reaches the Notification DLQ.
6. The handler makes no Task query/mutation, no recipient lookup, no generic rule evaluation, no `NotificationDispatch`, and no external side effect.
7. Task P1 has no invented stale-order rule; replay is `SAFE_REDELIVERY`, tenant-scoped and side-effect-free by default.

## 8. Follow-on implementation ownership

EV-5 may implement this contract only in these Notification-owned paths:

```text
src/services/system/notification-service/prisma/**
src/services/system/notification-service/src/application/**
src/services/system/notification-service/src/infrastructure/events/**
src/services/system/notification-service/src/infrastructure/inbox/**
src/services/system/notification-service/src/infrastructure/prisma/**
src/services/system/notification-service/src/modules/notification/notification.module.ts
src/services/system/notification-service/test/**
```

It depends on the frozen EV-1 common platform API, EV-2 Collaboration compiled contract and EV-3 topology. It must not change this contract, Collaboration payloads, Event Catalog, ADRs or common public APIs without their respective owners and governance flow.
