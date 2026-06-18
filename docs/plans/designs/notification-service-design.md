# Notification Service Design Workspace

## 0. 文档控制

```text
designKey: notification-service-design
designStatus: PAUSED_DESIGN_WORKSPACE
implementationStatus: DESIGN_IN_PROGRESS
lastUpdatedAt: 2026-06-17 15:43:55 CST
lastUpdatedBy: Codex notification-service design discussion thread
supersedes: notification-service discussion in current thread before archive
truthSource: docs/architecture/08-notification-architecture.md; docs/contracts/events/README.md; docs/contracts/events/catalog.md; docs/contracts/events/collaboration-service.md
doNotUseAsStableSource: false
conflictResolution: 本文只记录 notification-service 本轮重新设计的过程、已确认结论、开放问题、当前进度与回写计划；若本文与稳定 architecture / ADR / contracts 冲突，以稳定真相源为准。本文中的已确认结论在回写到稳定真相源前，不替代 architecture / contracts。
```

## 1. 目标

- 记录 `notification-service` / Notification / Message Dispatch 能力的本轮全局重审设计过程。
- 为本线程 archive 后继续设计提供恢复入口。
- 区分已确认边界、当前推荐、开放问题与后续回写目标，避免 Notification 被误做成 Task 通知、普通 provider proxy、共享 inbox 或完整 communication center。

## 2. 当前范围

本 workspace 负责：

- `notification-service` 的平台定位、服务边界与 P1 范围。
- gRPC 显式投递入口与 Event Catalog 事件订阅入口的职责分工。
- `NotificationRule`、`NotificationInboxItem`、`NotificationDispatch` 的 P1 模型边界。
- Web/App 系统内通知中心的 P1 API 范围。
- 与 Task P1 事件、Event Catalog、Audit、Identity、Communication、Reminder 的边界。
- 记录尚未冻结的 NotificationRule 管理形态、模板管理、实现计划与文档回写目标。

本 workspace 不负责：

- 替代稳定 architecture / service card / contract 文档。
- 重新定义 Task、Workflow、Activity、Audit、Communication Mailbox、Identity、HR、Party 或 Event Catalog 的服务真相。
- 维护所有服务的公共事件目录；该工作由 Event Catalog 盘点线程和各 owner service 线程负责。
- 指导当前实现线程直接编码。

## 3. 涉及对象

- services:
  - `notification-service`
  - `collaboration-service`
  - `auth-service`
  - `identity-service`
  - `permission-service`
  - future `workflow-service`
  - future `communication-service`
- features:
  - Notification P1 inbox foundation
  - Task P1 notification onboarding
  - Auth OTP / security dispatch continuation
  - future mobile push
  - future user notification preferences
  - future reminder / overdue notification onboarding
- collaborations:
  - notification / event catalog
  - notification / task
  - notification / auth
  - notification / communication mailbox
  - notification / audit
  - notification / identity and account
  - notification / gateway and tenant-web/app

## 4. 已冻结决定

| 日期 | 决定 | 影响范围 | 回写目标 |
| --- | --- | --- | --- |
| 2026-06-14 | `notification-service` 采用独立 Notification / Message Dispatch 治理服务定位，不是 provider proxy，也不是共享 inbox / communication center / reminder engine。 | service boundary | `docs/architecture/08-notification-architecture.md`; future `docs/architecture/services/notification-service.md` |
| 2026-06-14 | Notification 支持两个入口：gRPC 显式请求与 Event Subscription。业务事实通知优先走事件，Auth OTP / 安全类即时受理走 gRPC。 | integration boundary | architecture + contract draft |
| 2026-06-14 | Event Subscription 必须基于 Event Catalog；`NotificationRule` 只能引用 `FROZEN_SUBSCRIBABLE` 且 `notificationConsumable=true` 的事件。 | event governance | `docs/contracts/events/**`; notification architecture |
| 2026-06-14 | P1 不做“找人”。系统内通知接收人使用明确 `recipientAccountId`；外部渠道使用明确 address snapshot。 | recipient boundary | notification architecture + service card |
| 2026-06-14 | P1 简化核心模型为 `NotificationRule + NotificationInboxItem + NotificationDispatch`；不拆复杂 `Notification / RecipientNotification / Attempt` 模型。 | domain model | notification architecture + feature packet |
| 2026-06-14 | Web 通知中心与 App 内通知列表读取同一套 `NotificationInboxItem`。 | frontend/API | notification contract + gateway contract |
| 2026-06-14 | 普通用户 P1 不管理 channel 偏好；事件类型级 channel 由系统/租户管理员或平台规则管理。 | policy scope | notification architecture |
| 2026-06-14 | P1 `IN_APP` 必须支持；`EMAIL / SMS` 保留给现有 Auth/security dispatch；`MOBILE_PUSH` 作为未来 channel 预留，provider 接入后置。 | channel model | notification architecture + contract |
| 2026-06-14 | due soon / overdue / reminder 不属于 Notification 判定职责；P1 不实现 overdue/reminder。Notification 只接收已形成的 reminder 请求或事件。 | reminder boundary | notification architecture + future reminder design |
| 2026-06-14 | Notification 不替代 Audit。审计对齐 OES audit envelope，只覆盖管理、拒绝、高治理价值动作；普通 inbox 创建/已读/归档不进入高价值 audit。 | audit boundary | `docs/architecture/12-observability-and-audit-architecture.md`; notification architecture |
| 2026-06-14 | P1 Web/App API 只做 current account scoped 的 “我的通知”：列表、未读数、单条已读、全部已读、单条归档。 | API scope | notification contract + gateway/BFF contract |
| 2026-06-14 | P1 gRPC 不新增通用 `CreateNotificationRequest`；业务事实通知走 Event + Rule，Auth/security 继续走受控 `SendEmail / SendSms` 类显式 dispatch。 | gRPC boundary | notification proto / contract draft |
| 2026-06-17 | Task events are onboarding samples, not notification-service boundary. Notification P1 是通用事件到通知机制，Task 三事件只是第一批接入。 | scope clarity | notification architecture + feature packet |

## 5. 当前推荐但尚需最终确认

| 日期 | 议题 | 当前推荐 | 未完全冻结原因 | 下一步 |
| --- | --- | --- | --- | --- |
| 2026-06-17 | `NotificationRule` 管理是否进 P1 | 进 P1，但不要做通用 Rule Builder；采用“预定义 notification type + 管理员控制启停 / channel / template”的受控管理。 | 用户担心 template/channel/recipient/deepLink mapping 复杂化；当前推荐已简化，但尚未得到最终确认。 | 继续确认 Rule 管理的 P1 UI/API 表面。 |
| 2026-06-17 | recipient mapping / deepLink mapping 是否开放配置 | P1 不开放给管理员配置；由系统内置 handler 固定。例如 `TASK_ASSIGNED` 从 `assigneeAccountId` 取收件人，deepLink 为 `TASK_DETAIL(taskId)`。 | 需要在文档中明确“管理员面对业务概念，不面对 payload 字段”。 | 冻结 `NotificationTypeHandler` / predefined rule concept。 |
| 2026-06-17 | 模板管理是否 P1 闭环 | 倾向 P1 至少有受控模板选择或编辑能力，但可先限定模板 key 与变量，不允许自由绕过模板。 | 尚未展开模板管理、版本、多语言、变量校验、预览。 | 继续讨论 `NotificationTemplate` P1 范围。 |
| 2026-06-17 | `NotificationRule` scope | 倾向支持 `PLATFORM_DEFAULT` 与 `TENANT_OVERRIDE`，P1 可先实现管理员闭环但不引入用户偏好。 | 需要明确平台管理员与租户管理员的覆盖关系。 | 继续讨论 rule scope / permission。 |

## 6. 开放问题

| 日期 | 问题 | 为什么未冻结 | 下一步 |
| --- | --- | --- | --- |
| 2026-06-17 | 是否需要创建稳定服务职责真相源 `docs/architecture/services/notification-service.md` | 当前已有 `docs/architecture/08-notification-architecture.md`，但服务真相源规则要求单服务职责应落 `docs/architecture/services/<service-name>.md`。 | 文档回写阶段决定：抽取服务职责卡，并让 `08` 成为平台架构/协同说明或引用服务卡。 |
| 2026-06-17 | `notification-service-contract-draft.md` 是否需要重写 | 旧草案偏 Email/SMS dispatch；本轮新增 IN_APP、Inbox API、Rule、Event Catalog 入口。 | 冻结 P1 后更新 contract draft 或新增正式 contract。 |
| 2026-06-17 | `NotificationRule` 管理是否要有 gateway/admin BFF contract | 若 P1 管理闭环，需要管理员 API 与权限码。 | 冻结 Rule 管理后补 contract。 |
| 2026-06-17 | Realtime 提醒机制 | 已确认 Web/App 读取同一 inbox，但未冻结右上角红点/即时提示用轮询、SSE、WebSocket 还是后置 adapter。 | 建议 P1 先用 unread count/list polling；realtime adapter 后置或作为可选增强。 |
| 2026-06-17 | `MOBILE_PUSH` P1 是否只枚举预留还是做 dispatch 记录 | 当前倾向只预留 channel，不接 provider。 | Rule 管理若允许选择 channel，需要隐藏或标记未启用。 |
| 2026-06-17 | 管理员能否配置 `EMAIL/SMS` 用于业务事件 | 当前倾向 P1 限制 Task 只 `IN_APP`；Auth/security 走 gRPC dispatch。 | 需要防止管理员误把普通 Task 通知打开到 SMS/Email 造成噪音和成本。 |
| 2026-06-17 | 全服务 event inventory 对 Notification P1 的影响 | 另有 Event Catalog 盘点线程在运行；Notification P1 当前只依赖已冻结 Task 三事件。 | 本线程继续，不等待全量 inventory；未来新增事件由 owner service 补 contract 后再被 Rule 引用。 |

## 7. 当前 P1 设计快照

### 7.1 服务定位

`notification-service` 是统一 Notification / Message Dispatch 治理服务，负责通知规则、系统内通知、渠道投递、模板、状态、幂等、可观测性和受控审计。

它不拥有：

- Task / Workflow / Activity / Audit / Communication Mailbox 的业务事实真相。
- Identity / HR / Party / Contact 的人、账号、员工、联系方式主数据。
- due soon / overdue / reminder 的时间判定。
- 外部邮件线程、共享邮箱责任制、SLA 处理状态。

### 7.2 两个入口

Event 入口：

```text
FROZEN_SUBSCRIBABLE event
  -> NotificationRule
  -> predefined handler
  -> NotificationInboxItem / NotificationDispatch
```

gRPC 入口：

```text
auth-service / trusted internal service
  -> SendEmail / SendSms
  -> accepted / rejected
  -> dispatch lifecycle
```

P1 不开放通用 `CreateNotificationRequest`。

### 7.3 P1 数据对象

`NotificationRule`：

- 事件类型到通知类型、模板、channel、启停的治理配置。
- 当前推荐 P1 不开放 recipient/deepLink/payload mapping 的自由配置，改用预定义 handler。

`NotificationInboxItem`：

- Web/App “我的通知”统一数据源。
- 关键字段包括 `tenantId`、`orgId`、`recipientAccountId`、`notificationType`、`title/body snapshot`、`sourceEventId`、`sourceObjectRef`、`deepLinkRef`、`status`、`createdAt/readAt/archivedAt`、`traceId/requestId`。

`NotificationDispatch`：

- Email/SMS/未来 Mobile Push 等非站内渠道投递记录。
- `IN_APP` P1 不必制造复杂 attempt。

### 7.4 Inbox API

P1 推荐 gRPC 服务：

```text
NotificationInboxService
  ListMyNotifications
  GetMyUnreadNotificationCount
  MarkMyNotificationRead
  MarkAllMyNotificationsRead
  ArchiveMyNotification
```

约束：

- 只作用于 `recipientAccountId = currentAccountId`。
- 不做删除、搜索、管理员全局查询、用户偏好、重发补发、业务处理动作。

### 7.5 Task P1 onboarding sample

当前 Event Catalog 已冻结三条可被 Notification 消费的事件：

- `collaboration.task.assigned`
- `collaboration.task.completed`
- `collaboration.task.cancelled`

Task 事件只是第一批接入场景，不是 notification-service 的边界。

当前推荐的预定义处理逻辑：

```text
TASK_ASSIGNED:
  sourceEventType = collaboration.task.assigned
  channels = [IN_APP]
  recipient = payload.assigneeAccountId
  deepLinkRef = TASK_DETAIL(payload.taskId)

TASK_COMPLETED:
  sourceEventType = collaboration.task.completed
  channels = [IN_APP]
  recipients = payload.createdByAccountId + payload.assigneeAccountId
  skip actorAccountId
  deepLinkRef = TASK_DETAIL(payload.taskId)

TASK_CANCELLED:
  sourceEventType = collaboration.task.cancelled
  channels = [IN_APP]
  recipients = payload.createdByAccountId + payload.assigneeAccountId
  skip actorAccountId
  deepLinkRef = TASK_DETAIL(payload.taskId)
```

幂等建议：

```text
tenantId + sourceEventId + recipientAccountId + notificationType
```

## 8. 真相源回写计划

- 服务职责：
  - future `docs/architecture/services/notification-service.md`
  - update [08-notification-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/08-notification-architecture.md)
- 协同蓝图：
  - future task / notification collaboration
  - update [authentication-and-identity.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/authentication-and-identity.md) if auth notification wording changes
  - keep [10-communication-and-mailbox-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/10-communication-and-mailbox-architecture.md) aligned on boundary
- contracts：
  - update [notification-service-contract-draft.md](/Users/acehood/Documents/GitHub/oes/docs/plans/notification-service-contract-draft.md) or promote to `docs/contracts/notification-service/**`
  - keep [events README](</Users/acehood/Documents/GitHub/oes/docs/contracts/events/README.md>) and [catalog](</Users/acehood/Documents/GitHub/oes/docs/contracts/events/catalog.md>) as event entry truth
- feature packet / plan：
  - update [notification-service-foundation-plan.md](/Users/acehood/Documents/GitHub/oes/docs/plans/notification-service-foundation-plan.md)
  - consider new `docs/plans/features/notification-inbox-p1.md` after design freeze
- architecture / ADR：
  - ADR only if choosing between competing platform-level patterns, such as generic create-notification API vs event-only business notification governance.

## 9. 恢复入口

下次继续前先读：

- [notification-service-design.md](/Users/acehood/Documents/GitHub/oes/docs/plans/designs/notification-service-design.md)
- [08-notification-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/08-notification-architecture.md)
- [notification-service-foundation-plan.md](/Users/acehood/Documents/GitHub/oes/docs/plans/notification-service-foundation-plan.md)
- [notification-service-contract-draft.md](/Users/acehood/Documents/GitHub/oes/docs/plans/notification-service-contract-draft.md)
- [events README](</Users/acehood/Documents/GitHub/oes/docs/contracts/events/README.md>)
- [events catalog](</Users/acehood/Documents/GitHub/oes/docs/contracts/events/catalog.md>)
- [collaboration-service event contract](</Users/acehood/Documents/GitHub/oes/docs/contracts/events/collaboration-service.md>)
- [12-observability-and-audit-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/12-observability-and-audit-architecture.md)
- [10-communication-and-mailbox-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/10-communication-and-mailbox-architecture.md)

当前推荐下一步：

- 继续冻结 `NotificationRule` 管理的 P1 表面：
  - 是否采用预定义 notification type 管理。
  - 管理员可配置哪些字段：启停、channel、template。
  - 是否 P1 做模板编辑 / 预览。
  - 权限码与审计事件。
- 然后冻结 `NotificationTemplate` P1。
- 然后进入文档回写：服务职责卡、architecture、contract、foundation plan 或 feature packet。

## 10. 本次 workspace 创建记录

| 日期 | 事项 | 说明 |
| --- | --- | --- |
| 2026-06-17 | 创建 Notification design workspace | 用户计划 archive 当前线程，本文记录本线程已确认结论、当前推荐、开放问题与恢复入口。 |

## 11. 当前线程归档检查点

截至 2026-06-17 15:43:55 CST，本线程可归档。后续恢复时应以本文作为过程入口，但不能直接把本文替代为稳定真相源。

已确认可作为后续冻结输入的内容：

- `notification-service` 的独立治理服务定位。
- gRPC 显式投递入口与 Event Catalog 事件入口并存的双入口模型。
- Event 入口只能消费 Event Catalog 中 `FROZEN_SUBSCRIBABLE` 且 `notificationConsumable=true` 的事件。
- P1 采用 `NotificationRule`、`NotificationInboxItem`、`NotificationDispatch` 三个核心概念。
- P1 支持 Web/App 共用的 `IN_APP` 通知中心，并保留 Auth/security 的 Email/SMS dispatch。
- Task 三事件只是第一批 onboarding sample，不是 Notification 服务边界。
- P1 不做 overdue/reminder、用户 channel 偏好、重发补发、复杂策略、recipient resolver 和通用 `CreateNotificationRequest`。

归档时仍未完成冻结的内容：

- `NotificationRule` 管理 P1 表面：最终应采用预定义 notification type 管理，还是允许更灵活的配置，需要继续收口。
- `NotificationTemplate` P1 范围：是否支持模板编辑、版本、多语言、变量校验与预览。
- Rule scope 与管理员权限：`PLATFORM_DEFAULT` / `TENANT_OVERRIDE` 的覆盖关系、权限码和审计事件尚未冻结。
- Realtime 提醒机制：P1 轮询、SSE、WebSocket 或后置 adapter 尚未冻结。
- 稳定文档回写：尚未更新服务真相源、architecture、contract draft、foundation plan 或 feature packet。

恢复本设计时推荐从以下问题继续：

```text
NotificationRule P1 是否采用“预定义 notification type + 管理员启停/channel/template”的受控管理模式？
如果认同，继续冻结 NotificationTemplate P1，然后进入稳定文档回写。
```
