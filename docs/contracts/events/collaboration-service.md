# collaboration-service Event Contract

更新时间：2026-06-14

本文冻结 `collaboration-service` Task P1 中供跨服务订阅的公共事件契约。`collaboration-service` 的长期职责、Task 对象、权限与状态语义以 [collaboration-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/collaboration-service.md) 为准；Task command 黑盒语义以 [task-command.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/collaboration-service/task-command.md) 为准。

## 0. 范围

本轮只冻结 Notification P1 需要消费的三个事件：

- `collaboration.task.assigned`
- `collaboration.task.completed`
- `collaboration.task.cancelled`

本轮不冻结：

- `collaboration.task.created`
- `collaboration.task.updated`
- `collaboration.task.started`
- `collaboration.task.reopened`
- `collaboration.task.archived`
- `collaboration.task.unarchived`
- due soon / overdue / reminder 事件
- task 与业务对象、workflow、project、team queue、annotation、comment 的后续协同事件
- broker topic、outbox 表、重试、DLQ 或 schema registry 实现

## Common Envelope

三个事件共享以下 envelope 语义：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `eventId` | string | 是 | 全局唯一事件 ID。 |
| `eventType` | string | 是 | 本文冻结的 dot-case event type。 |
| `eventVersion` | number | 是 | 当前固定为 `1`。 |
| `ownerService` | string | 是 | 固定为 `collaboration-service`。 |
| `occurredAt` | string | 是 | ISO-8601 时间，表示 Task 事实在 owner service 中成立的时间。 |
| `tenantId` | string | 是 | Task 所属租户。 |
| `orgId` | string \| null | 否 | P1 Task 可为空；后续组织范围由 collaboration-service 设计确认。 |
| `aggregateType` | string | 是 | 固定为 `TASK`。 |
| `aggregateId` | string | 是 | Task ID。 |
| `actorAccountId` | string | 是 | 执行动作的账号。 |
| `traceId` | string | 是 | 链路追踪 ID。 |
| `correlationId` | string \| null | 否 | 跨消息或流程关联 ID。 |
| `causationId` | string \| null | 否 | 触发本事件的 command / request / event ID。 |
| `auditRef` | string \| null | 否 | collaboration-service 本地审计引用。 |
| `payload` | object | 是 | 事件业务载荷。 |

Consumer 必须容忍 envelope 新增 optional 字段。

## Common Payload Fields

三个事件共享以下 payload 字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `taskId` | string | 是 | Task ID，必须等于 envelope `aggregateId`。 |
| `createdByAccountId` | string | 是 | Task 创建人账号。 |
| `assigneeAccountId` | string | 是 | Task 当前处理人账号。 |
| `status` | string | 是 | 事件发生后的 Task 状态。 |
| `previousStatus` | string \| null | 否 | 状态变化事件必须携带；非状态变化事件可为空。 |
| `priority` | string | 是 | Task 优先级快照。 |
| `dueAt` | string \| null | 否 | Task 到期时间快照。 |
| `titleSnapshot` | string | 是 | Task 标题快照，用于通知或时间线摘要。 |

payload 不携带 `description`。消费者不得把 `titleSnapshot` 当作 Task 当前标题真相；需要最新 Task 详情时必须通过 `collaboration-service` 查询契约读取。

## 1. `collaboration.task.assigned`

| 属性 | 值 |
| --- | --- |
| Owner service | `collaboration-service` |
| Status | `FROZEN_SUBSCRIBABLE` |
| Event version | `1` |
| Notification consumable | 是 |
| Implementation alias | `TaskAssigned` |
| Aggregate type | `TASK` |

### 触发条件

当 `CreateTask` 成功创建 assigned task，且 `assigneeAccountId != actorAccountId` 时发布。

Self todo 创建不发布 `collaboration.task.assigned`。

### Payload

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `taskId` | string | 是 | 已创建并被指派的 Task ID。 |
| `createdByAccountId` | string | 是 | 创建并指派任务的账号。 |
| `assigneeAccountId` | string | 是 | 被指派账号。 |
| `status` | string | 是 | 固定为创建后的状态，P1 为 `OPEN`。 |
| `previousStatus` | string \| null | 否 | 创建指派事件可为空。 |
| `priority` | string | 是 | 创建时的优先级快照。 |
| `dueAt` | string \| null | 否 | 创建时的到期时间快照。 |
| `titleSnapshot` | string | 是 | 创建时的标题快照。 |

### Consumer 语义

NotificationRule 可用该事件触发“任务被指派给你”类通知。通知收件人解析应以 `assigneeAccountId` 为主要输入，但最终通知策略、模板、渠道和投递状态归 `notification-service`。

## 2. `collaboration.task.completed`

| 属性 | 值 |
| --- | --- |
| Owner service | `collaboration-service` |
| Status | `FROZEN_SUBSCRIBABLE` |
| Event version | `1` |
| Notification consumable | 是 |
| Implementation alias | `TaskCompleted` |
| Aggregate type | `TASK` |

### 触发条件

当 `CompleteTask` 成功使 Task 从 `OPEN` 或 `IN_PROGRESS` 进入 `COMPLETED` 时发布。

若 Task 已经是 `COMPLETED`，幂等成功不应重复发布新的 `collaboration.task.completed`。

### Payload

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `taskId` | string | 是 | 已完成的 Task ID。 |
| `createdByAccountId` | string | 是 | Task 创建人账号。 |
| `assigneeAccountId` | string | 是 | Task 完成时的处理人账号。 |
| `status` | string | 是 | 固定为 `COMPLETED`。 |
| `previousStatus` | string | 是 | 完成前状态，P1 为 `OPEN` 或 `IN_PROGRESS`。 |
| `priority` | string | 是 | 完成时的优先级快照。 |
| `dueAt` | string \| null | 否 | 完成时的到期时间快照。 |
| `titleSnapshot` | string | 是 | 完成时的标题快照。 |
| `completedByAccountId` | string | 是 | 执行完成动作的账号，通常等于 envelope `actorAccountId`。 |
| `completedAt` | string | 是 | 完成时间。 |

### Consumer 语义

NotificationRule 可用该事件触发“任务已完成”类通知。通知接收策略可参考 `createdByAccountId` 与 `assigneeAccountId`，但不得假设所有相关人都必须收到通知。

## 3. `collaboration.task.cancelled`

| 属性 | 值 |
| --- | --- |
| Owner service | `collaboration-service` |
| Status | `FROZEN_SUBSCRIBABLE` |
| Event version | `1` |
| Notification consumable | 是 |
| Implementation alias | `TaskCancelled` |
| Aggregate type | `TASK` |

### 触发条件

当 `CancelTask` 成功使 Task 从 `OPEN` 或 `IN_PROGRESS` 进入 `CANCELLED` 时发布。

若 Task 已经是 `CANCELLED`，幂等成功不应重复发布新的 `collaboration.task.cancelled`。

### Payload

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `taskId` | string | 是 | 已取消的 Task ID。 |
| `createdByAccountId` | string | 是 | Task 创建人账号。 |
| `assigneeAccountId` | string | 是 | Task 取消时的处理人账号。 |
| `status` | string | 是 | 固定为 `CANCELLED`。 |
| `previousStatus` | string | 是 | 取消前状态，P1 为 `OPEN` 或 `IN_PROGRESS`。 |
| `priority` | string | 是 | 取消时的优先级快照。 |
| `dueAt` | string \| null | 否 | 取消时的到期时间快照。 |
| `titleSnapshot` | string | 是 | 取消时的标题快照。 |
| `cancelledByAccountId` | string | 是 | 执行取消动作的账号，通常等于 envelope `actorAccountId`。 |
| `cancelledAt` | string | 是 | 取消时间。 |
| `cancelReasonSnapshot` | string \| null | 否 | 取消原因摘要；不得作为长文本正文存储来源。 |

### Consumer 语义

NotificationRule 可用该事件触发“任务已取消”类通知。通知接收策略可参考 `createdByAccountId` 与 `assigneeAccountId`，但不得把取消原因摘要当作 Task 或审计详情真相。

## 4. 兼容性规则

同一 `eventVersion=1` 内允许：

- 增加 optional envelope 字段。
- 增加 optional payload 字段。
- 增加消费者可忽略的状态补充字段。

同一 `eventVersion=1` 内禁止：

- 删除本文已冻结字段。
- 改变 `taskId`、`createdByAccountId`、`assigneeAccountId` 的身份含义。
- 将 `titleSnapshot` 改为 Task 当前详情真相。
- 在 payload 中加入 `description` 或完整 Task 内部对象。
- 将 Task command 的幂等成功重复解释为新事实事件。

不兼容变更必须新增 `eventVersion` 并更新 [catalog.md](./catalog.md)。

## 5. 订阅纪律

消费者必须：

- 按至少一次投递处理，保证幂等。
- 容忍重复、乱序、延迟和重放。
- 只把事件作为事实输入，不接管 Task 真相。
- 需要最新 Task 详情时通过 `collaboration-service` query contract 读取。
- 不订阅本文未冻结的 Task 事件。

`notification-service` 使用这些事件时，只能把它们作为通知规则输入。模板、渠道、收件人解析、偏好、投递任务、回执、重试和成本治理仍归 `notification-service`。
