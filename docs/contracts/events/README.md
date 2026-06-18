# OES Event Catalog Contract

更新时间：2026-06-14

本文冻结 OES 第一版文档化 Event Catalog / Event Contract 协作机制。它不是 broker 选型、schema registry、outbox 实现或消息中间件运行手册。

## 1. 目的

Event Catalog 用于回答：

- 哪个 owner service 对外发布了哪些稳定事实事件。
- 哪些事件允许跨 bounded context 订阅。
- 事件 envelope、payload、版本与兼容性如何治理。
- NotificationRule、timeline、BI、search、AI 后处理等消费者可以依赖哪些事件。

Event Catalog 不用于：

- 重新定义服务核心对象或 owner 边界。
- 替代 `docs/architecture/services/*.md` 服务稳定真相源。
- 替代 `docs/architecture/collaborations/*.md` 跨服务协同设计。
- 记录服务内部 local event、进程内 `EventEmitter`、audit pipeline 或临时 outbox 实现细节。
- 决定 broker、topic、partition、重试队列、DLQ 或 schema registry 技术实现。

## 2. 事件分类

| 类型 | 说明 | 是否进入 Event Catalog |
| --- | --- | --- |
| local event | 服务进程内事件、框架事件、模块内钩子。 | 否 |
| audit event | 为合规、审计、追责、操作历史而记录的本地审计事实。 | 默认否；除非另行冻结为公共审计事件 |
| domain event | 服务内部领域事实，可用于本地事务、领域模型或 outbox。 | 不自动进入 |
| integration event / public subscribable event | owner service 在本地事务成功后对外发布的稳定跨上下文事实。 | 是 |
| notification rule consumed event | `notification-service` 的 NotificationRule 可引用的公共可订阅事件。 | 是，且必须标记 `notificationConsumable=true` |

代码里出现 `EventEmitter`、`emit`、`publish`、`outbox` 或 `eventType`，不代表该事件已经成为公共可订阅契约。

## 3. 文档结构

事件契约入口固定为：

- [catalog.md](./catalog.md)：全局事件索引。
- `<service-name>.md`：单个 owner service 的事件契约，例如 [collaboration-service.md](./collaboration-service.md)。

每个 owner service 只能维护自己拥有的事件契约。其他服务、feature packet、design workspace 或 collaboration 文档可以引用这些契约，但不得重新定义同一事件的语义、payload 或版本规则。

## 4. 事件状态

| 状态 | 含义 | 消费者能否订阅 |
| --- | --- | --- |
| `PROPOSED` | 建议新增，尚未被 owner service 确认。 | 否 |
| `DESIGNED_NOT_IMPLEMENTED` | 已有稳定设计，但尚未实现或未进入发布路径。 | 否，除非 feature 明确接受 mock/stub |
| `IMPLEMENTED_UNCONTRACTED` | 代码已有发布或订阅，但尚未冻结契约。 | 否 |
| `FROZEN_SUBSCRIBABLE` | 契约已冻结，可被跨服务消费者订阅。 | 是 |
| `DEPRECATED` | 已有替代或计划下线，仍在兼容窗口。 | 仅存量消费者 |
| `SUPERSEDED` | 已被替代事件覆盖，不再新增订阅。 | 否 |

NotificationRule 只能引用 `FROZEN_SUBSCRIBABLE` 且 `notificationConsumable=true` 的事件。

## 5. 命名规范

公共 event type 使用小写 dot-case：

```text
<bounded-context>.<aggregate-or-capability>.<past-tense-fact>
```

示例：

- `collaboration.task.assigned`
- `collaboration.task.completed`
- `collaboration.task.cancelled`

命名要求：

- 使用已经发生的事实，不使用命令式动词。
- 不在 event type 中包含版本号；版本使用 `eventVersion` 字段。
- 不暴露技术实现名、class name、broker topic 或数据库表名。
- 可以记录 `implementationAlias`，用于映射既有代码或服务文档中的 `TaskAssigned` 这类名称。

## 6. 最小 Envelope

所有公共可订阅事件至少具备以下 envelope 语义：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `eventId` | 是 | 全局唯一事件 ID。 |
| `eventType` | 是 | 公共 dot-case event type。 |
| `eventVersion` | 是 | 事件契约版本，初始为 `1`。 |
| `ownerService` | 是 | 事件 owner service。 |
| `occurredAt` | 是 | owner service 确认事实成立的时间。 |
| `tenantId` | 是 | 显式租户边界。 |
| `orgId` | 否 | 场景适用时携带组织边界。 |
| `aggregateType` | 是 | 事件所属对象类型。 |
| `aggregateId` | 是 | 事件所属对象 ID。 |
| `actorAccountId` | 否 | 触发该事实的账号；系统动作可为空或使用系统 actor。 |
| `traceId` | 是 | 链路追踪 ID。 |
| `correlationId` | 否 | 跨消息/流程关联 ID。 |
| `causationId` | 否 | 触发该事件的 command、event 或 request ID。 |
| `auditRef` | 否 | owner service 本地审计引用。 |
| `payload` | 是 | 事件业务载荷。 |

Envelope 字段是跨服务事件基础语义。具体 broker message shape 可由后续基础设施实现映射，但不得丢失上述语义。

## 7. Payload 记录方式

第一阶段使用 Markdown 表冻结 payload schema：

- 字段名。
- 类型。
- 必填性。
- 说明。
- 兼容性规则。

payload 只携带消费者理解事件所需的 ID、状态和必要快照。不得把 owner service 的完整内部实体、长文本正文、数据库结构或 UI 专用模型直接塞入 payload。

## 8. 版本与兼容性

`eventVersion` 初始为 `1`。同一版本内允许：

- 新增 optional 字段。
- 新增 enum 值，但消费者必须容忍 unknown。
- 放宽字段约束。
- 增加不改变既有语义的快照字段。

同一版本内禁止：

- 删除已冻结字段。
- 修改字段含义。
- 将 optional 字段改为 required。
- 改变 ID 归属、状态语义、时间语义或租户边界语义。
- 把 consumer 依赖的 payload 字段改成另一服务的内部对象结构。

不兼容变更必须新增 `eventVersion`，并写明迁移窗口、双发策略或替代事件。

## 9. Owner Service 责任

owner service 必须：

- 只发布自己拥有真相的事实事件。
- 在本地事务成功后发布事件。
- 维护本服务事件契约、版本、deprecated / superseded 信息。
- 确保 payload 不泄露非必要敏感信息或他域内部真相。
- 明确事件是否可被 NotificationRule 消费。
- 明确事件与本地 audit fact 的关系，但不把 audit 表当公共契约。

owner service 不得：

- 为其他服务定义事件。
- 发布尚未成为本服务事实的命令意图。
- 依赖消费者回写来完成本服务本地事务。
- 用事件绕过 gRPC 写前强校验。

## 10. Consumer 订阅纪律

consumer service 必须：

- 只订阅 `FROZEN_SUBSCRIBABLE` 事件。
- 按至少一次投递处理，保证幂等。
- 容忍重复、乱序、延迟、缺失和重放。
- 只把事件作为事实输入，不反向接管 owner service 真相。
- 不从源码、测试、outbox 表或 broker topic 猜测未声明事件。
- 不依赖事件完成当前 command 的同步成功/失败闭环。

NotificationRule 额外要求：

- 只能引用 `notificationConsumable=true` 的事件。
- 不得引用 audit event、local event、未冻结 domain event 或未声明 outbox event。
- 模板、渠道、收件人解析、投递状态仍归 `notification-service`，事件 owner 只负责事实发布。

## 11. Deprecated / Superseded

废弃事件必须记录：

- 当前状态：`DEPRECATED` 或 `SUPERSEDED`。
- 替代事件。
- 最后允许新增订阅日期。
- 存量消费者迁移要求。
- 兼容发送截止条件。

被替代事件不得继续扩展 payload 或新增消费者。

## 12. 第一批冻结范围

当前只冻结 `collaboration-service` Task P1 中 Notification P1 需要消费的三个事件：

- `collaboration.task.assigned`
- `collaboration.task.completed`
- `collaboration.task.cancelled`

其他服务事件、terminal device 事件、MES outbox 事件、Sales / Procurement / Finance / WMS deferred candidate events 均不在本次冻结范围内。
