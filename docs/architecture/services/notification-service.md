# notification-service

```text
status: FROZEN_NOTIFICATION_EVENT_CONSUMER_P1
lastUpdated: 2026-07-26
serviceTruthSource: true
runtimeStatus: PARTIALLY_IMPLEMENTED
```

## 1. 服务职责

`notification-service` 是 OES 的通知治理服务。它把已成立的业务事实或受控的内部投递请求，转换为自己拥有的系统内通知或外部渠道投递记录，并负责这些本地结果的模板、幂等、状态、可观测性与受控审计。

本文件是 `notification-service` 唯一稳定服务真相源。通知平台级背景、渠道演进与 provider 原则参见 [08-notification-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/08-notification-architecture.md)，但不得以该文替代本文件重新定义本服务的对象、边界或命名。

## 2. 拥有的对象与事实

| 对象 | 所有权与用途 |
| --- | --- |
| `NotificationInboxItem` | 某个明确账号在某租户内可见的系统内通知；保存通知类型、显示快照、来源引用、深链引用和已读/归档状态。Web 与 App 的“我的通知”读取同一对象。 |
| `NotificationInboxEvent` | 某逻辑 consumer 已处理的公共事件 Inbox 记录；用于 at-least-once 消费的身份、digest、结果、tenant 与 trace 幂等边界。 |
| `NotificationDispatch` | 外部 Email、SMS 与未来 Push/IM/Webhook 的受理与投递生命周期；它不等同于系统内 InboxItem。 |
| `NotificationTemplate` | 通知模板标识、版本、locale、受限变量定义和渲染规则。 |
| `NotificationRule` | 未来事件到通知类型/渠道的治理配置。其通用管理、覆盖关系和 UI 不属于当前 Task P1。 |

## 3. 不拥有的事实

`notification-service` 不拥有，也不得通过本地副本重建：

- Task、Task 状态、Task 权限、Task 当前标题或取消原因；这些以 `collaboration-service` 为准。
- User、UserAccount、联系人、邮箱、手机号、员工与组织主数据；这些以身份、主体与租户/组织服务的稳定边界为准。
- 业务动作的授权真相。事件中的 `actorAccountId` 仅用于归因和自通知排除，不是下游授权委托。
- 邮件线程、共享收件箱、认领、SLA、外部沟通归档或 AI 回复；这些属于未来 communication/mailbox 能力。

## 4. 入口与边界

| 入口 | 适用范围 | 结果 |
| --- | --- | --- |
| 受控 gRPC dispatch | Auth/security 等需要同步获得“已受理/已拒绝”的外部渠道请求 | `NotificationDispatch`；OTP 与认证事实仍归 `auth-service`。 |
| 公共业务事件 | 已在 Event Catalog 冻结、可订阅的业务事实 | 本服务自己的 Inbox/通知结果；业务服务不提交已渲染文案或 provider 指令。 |

公共事件 consumer 必须引用 owner 在 `src/common/src/contracts/<service_snake_case>/events.ts` 维护的同一编译期契约，使用本服务 Inbox 和本地事务处理至少一次投递；不得查询或写入来源服务数据库。

## 5. Collaboration Task P1：冻结的系统内通知行为

本服务第一条 Event Bus 垂直切片只消费下列已冻结的公共事实：

- `collaboration.task.assigned`
- `collaboration.task.completed`
- `collaboration.task.cancelled`

行为以 [Collaboration Task event consumer contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/notification-service/collaboration-task-event-consumer.md) 为准。用户确认的产品语义是：

- 别人给我安排任务时通知我；
- 我指派的任务完成时通知我；
- 任务取消时通知指派人与被指派人，但不通知执行取消的人本人；
- 用户可在系统内通知中心点击进入该任务。

这个 P1 使用内置的预定义 handler，直接生成 `NotificationInboxItem`。它不创建 `NotificationDispatch`、不调用 Email/SMS/Push provider、也不创建或读取通用 `NotificationRule` 记录。

## 6. 多租户、安全与审计

- 每个 Inbox 记录、通知项、DLQ/重放操作记录都必须带 `tenantId`，`orgId` 仅在事件携带时保留为范围快照。
- 读取、已读和归档只允许当前账号在当前租户内操作自己的 `NotificationInboxItem`；事件 consumer 不以事件 actor 获得任何读取或写入授权。
- 公共事实的 `tenantId` 不得被改写、跨租户合并或用于推导其他租户收件人。
- P1 的普通 InboxItem 创建、已读、归档不产生高价值业务审计；事件处理、Inbox 冲突、DLQ 与 replay 必须保留 `eventId`、tenant、consumer、trace 和操作审计关联。

## 7. 可靠性与重放

Notification 的事务边界是：`NotificationInboxEvent` 与本次产生的零至多个 `NotificationInboxItem` 在同一个 Notification 数据库事务内写入。`(consumerName, eventId)` 是最终幂等键；identity tuple 或 canonical body digest 不等价的同 ID 重用必须进入本 consumer DLQ。

该 Task P1 没有 Task 版本字段，因而不凭到达顺序推断“旧事件”；每个有效事件都是独立通知事实。P1 replay 仅支持 `SAFE_REDELIVERY`，默认不允许外部副作用；相同输入只返回 duplicate，不增加系统内通知。

## 8. 明确不在本次冻结范围

- 通用 `NotificationRule` 管理、管理员规则 UI、自由 payload/recipient/deep-link 映射。
- 模板编辑、预览、多语言策略和用户个人通知偏好。
- SSE/WebSocket、移动推送、Email/SMS 业务通知与外部 provider dispatch。
- Task 关注者、评论提及、项目角色、群组或任意“找人”收件人解析。
- Task 当前详情查询、任务状态写入或任何业务动作。

这些能力需要各自的产品语义、服务契约与实现包，不得以本 P1 handler 的临时分支方式加入。

## 9. 真相源与后续实现边界

| 内容 | 真相源 / owner |
| --- | --- |
| Notification 服务边界与对象 | 本文件 |
| Task 事件 owner、payload 与触发语义 | [collaboration-service event contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/collaboration-service.md) |
| Event Bus、Inbox、DLQ 与 replay 平台语义 | [17-event-bus-and-outbox-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/17-event-bus-and-outbox-architecture.md) 与 [platform transport contract](/Users/acehood/Documents/GitHub/oes/docs/contracts/events/platform-transport.md) |
| Task 到本地通知的黑盒语义 | [notification-service contracts](/Users/acehood/Documents/GitHub/oes/docs/contracts/notification-service/README.md) |
| 未来 Notification consumer implementation owner paths | `src/services/system/notification-service/prisma/**`, `src/services/system/notification-service/src/application/**`, `src/services/system/notification-service/src/infrastructure/events/**`, `src/services/system/notification-service/src/infrastructure/inbox/**`, `src/services/system/notification-service/src/infrastructure/prisma/**`, `src/services/system/notification-service/src/modules/notification/notification.module.ts`, `src/services/system/notification-service/test/**` |

当前 runtime 中的 Email/SMS dispatch schema、gRPC controller 和本地 provider adapter 仅是现有实现证据，不能覆盖本文件或事件 consumer 契约。
