# Object Activity Foundation

## 1. 目标

- 将平台级 `ObjectActivity / ObjectTimeline` 已冻结结论回写为可执行 feature packet，作为后续 `ACTIVITY-CONTRACT` 的唯一主线入口。
- 建立 phase 1 最小协作闭环：
  - `ObjectActivity`
  - `ObjectTimeline`
  - service-local activity fact
  - service-local outbox
  - future unified projection
- 明确该能力服务于业务协作与对象时间线，不吞掉 audit、评论、审批、通知或业务对象状态机真相。

## 2. 不做什么

- 不在本 packet 中新建中心 `activity-service` runtime。
- 不在本 packet 中进入代码实现、proto 字段设计、数据库结构设计或 UI 设计。
- 不在本 packet 中把 audit 表直接当作 timeline 存储或查询入口。
- 不在本 packet 中让 `ObjectActivity` 接管 comment、mention、attachment、workflow、approval、notification 的源事实。
- 不在本 packet 中把 timeline 当作业务对象当前状态的真相源。

## 3. 上游依赖

- architecture:
  - [12-observability-and-audit-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/12-observability-and-audit-architecture.md)
- services:
  - [auth-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/auth-service.md)
  - [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)
  - [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md)
  - [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md)
  - [item-master-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/item-master-service.md)
  - [sales-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/sales-service.md)
- collaborations:
  - [object-activity-and-timeline.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/object-activity-and-timeline.md)
- plans:
  - [sales-quote-order-core.md](/Users/acehood/Documents/GitHub/oes/docs/plans/features/sales-quote-order-core.md)
- governance:
  - [change-boundary-rules.md](/Users/acehood/Documents/GitHub/oes/docs/governance/change-boundary-rules.md)

## 4. 当前结论

- `ObjectActivity / ObjectTimeline` 是 OES 平台级能力。
- phase 1 不等于立刻新建中心 `activity-service`。
- 推荐形态是：
  - 各服务本地 activity fact
  - 各服务本地 outbox
  - future unified projection
- `ObjectActivity` 是面向业务协作的可读活动事实。
- `ObjectTimeline` 是围绕某个对象展示活动、评论、审批里程碑、关联操作的读模型。
- `AuditLog` 面向合规、追责、安全、不可抵赖；`ObjectActivity` 面向业务协作和对象时间线。
- 不能用 audit 表直接充当 timeline。
- `ObjectActivity` 不替代 workflow / approval / notification / comment / attachment / 业务对象状态机。
- AI 可以消费 `ObjectActivity` 做对象摘要、原因解释、进度总结，但不能把 timeline 当业务真相。

## 5. 契约真相位置

- 稳定协同蓝图：
  - [object-activity-and-timeline.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/collaborations/object-activity-and-timeline.md)
- 相关平台边界：
  - [12-observability-and-audit-architecture.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/12-observability-and-audit-architecture.md)
- 下一步 contract 入口：
  - future `docs/contracts/object-activity/**`
  - 如 query 入口最终挂在 `api-gateway` / BFF，应在相关 gateway contracts 中引用统一 timeline query 规则
  - 如 publish 入口按 service-local ownership 展开，应在各对象 owner 服务 contract 中引用统一 activity publish envelope

## 6. 当前 slice

- slice:
  - platform `object-activity` foundation
- status:
  - ready-for-activity-contract
- scope:
  - `ObjectActivity` 最小模型
  - `ObjectTimeline` 读模型边界
  - phase 1 activity type taxonomy
  - 降噪规则
  - `Item / Quote / SalesOrder` 第一优先接入
  - `MES WorkOrder / WMS FulfillmentSet` 第二优先接入
  - future unified projection 的读模型前提
- ready definition:
  - 平台级协同蓝图已回写
  - audit 与 activity 的边界已冻结
  - phase 1 对象范围与 deferred 清单已冻结
  - 后续 contract 线程可以在不重新讨论 owner 边界的前提下继续推进

## 7. 最小模型

phase 1 必须冻结以下字段：

- `activityId`
- `tenantId`
- `objectType`
- `objectId`
- `activityType`
- `actorType`
- `actorId`
- `actorDisplayNameSnapshot`
- `occurredAt`
- `title`
- `description`
- `changeSet`
- `relatedObjectRefs`
- `sourceService`
- `traceId`
- `visibilityScope`

字段语义要求：

- `actorDisplayNameSnapshot` 用于保留活动发生时的人类可读展示名，不要求读取时回表重算历史名称。
- `changeSet` 用于表达“这次对协作者而言改了什么”，不承接逐字段审计明细。
- `relatedObjectRefs` 用于关联评论、审批单、附件、来源单据等对象引用，但不转移这些对象的 ownership。
- `visibilityScope` 用于约束时间线读取范围，但不取代 `permission-service` 的授权判定。

## 8. Phase 1 Activity Types

- `CREATED`
- `UPDATED`
- `FIELD_CHANGED`
- `STATUS_CHANGED`
- `COMMENT_ADDED`
- `APPROVAL_REQUESTED`
- `APPROVAL_APPROVED`
- `APPROVAL_REJECTED`
- `ASSIGNED`
- `RELEASED`
- `CANCELLED`
- `SYSTEM_EVENT`

## 9. 生成与降噪规则

- 一次用户可见写操作通常只生成一条 primary activity。
- 不按字段爆炸生成大量 timeline item。
- 多字段变更应优先聚合到同一条活动，并通过 `changeSet` 表达差异。
- 纯技术性后台动作默认不进入对象时间线，除非它们对业务协作具有明确阅读价值。
- audit fact 与 activity fact 可以同时存在，但不得互相代替。

## 10. Phase 1 推荐范围

### 10.1 第一优先接入对象

- `Item`
- `Quote`
- `SalesOrder`

### 10.2 第二优先接入对象

- `MES WorkOrder`
- `WMS FulfillmentSet`

### 10.3 条件接入

- `FulfillmentDemand`
  - 前提是 fulfillment boundary 先冻结。

### 10.4 后置

- `WipUnit`
- `PackageUnit`

## 11. 采用规则

### 11.1 Item

- `item-master-service` 负责围绕 `Item` 的创建、更新、能力变化与状态变化生成 activity fact。
- `ObjectActivity` 不拥有 `ItemCapability` 真相，只负责表达可读活动。

### 11.2 Quote / SalesOrder

- `sales-service` 负责围绕 `Quote`、`SalesOrder` 的创建、发布、状态变化、评论与审批里程碑生成 activity fact。
- `ObjectActivity` 不接管 `QuoteVersion`、订单成立、允许生产 / 备货 / 发货这些业务语义的真相，只表达其已发生的协作事实。

### 11.3 MES WorkOrder / WMS FulfillmentSet

- 第二优先对象在对应服务边界冻结后接入。
- timeline 只能消费这些对象对外发布的协作事实，不得反向定义制造执行或仓储执行真相。

## 12. Deferred 清单

- 中心 `activity-service` runtime 是否需要建立
- `ObjectTimeline` 的统一物化存储形态
- 完整 comment thread 读模型
- mention 解析与通知联动规则
- attachment 版本与预览协同规则
- workflow / approval 的完整 timeline 投影模型
- `FulfillmentDemand` 接入口径，直到 fulfillment boundary 冻结
- `WipUnit`
- `PackageUnit`
- timeline 跨对象聚合 feed、订阅、关注与 inbox 语义
- AI 基于 timeline 的主动建议、预测或自动动作

## 13. 下一步 contract / implementation 建议

- `ACTIVITY-CONTRACT` 第一优先应冻结：
  - activity publish envelope 的语义边界
  - `ObjectTimeline` query 的黑盒读面
  - `visibilityScope` 与授权判定协作口径
  - `changeSet / relatedObjectRefs` 的最小表达规则
  - `Item / Quote / SalesOrder` 三类对象的最小 publish 触发面
- contract 阶段不应先把问题退化成“中心表长什么样”或“新服务叫什么接口”。
- realization 阶段建议按对象 owner 服务逐个接入本地 activity fact / outbox，再视查询需求评估统一投影，而不是反过来先搭中心 runtime。

## 14. 线程分工

| Thread / Owner | 职责 | 允许修改路径 | 输入 | 输出 | 状态 |
| --- | --- | --- | --- | --- | --- |
| ACTIVITY-ARCH-WRITEBACK thread | 回写平台级协同蓝图与 phase 1 feature packet | `docs/architecture/collaborations/object-activity-and-timeline.md`, `docs/plans/features/object-activity-foundation.md`, 必要索引页 | 已冻结输入、相关服务职责卡、audit architecture、sales packet | 协同蓝图、feature packet | completed |
| ACTIVITY-CONTRACT thread | 冻结 publish / query 黑盒契约 | future `docs/contracts/object-activity/**`, 必要时相关 owner service contracts | 当前协同蓝图与 feature packet | 统一 activity contract、timeline query contract | pending |
| ACTIVITY-REALIZATION thread | 在已冻结边界内推进 service-local activity fact / outbox 与查询接入 | future `src/services/**`、必要 gateway / BFF 路径 | feature packet、contracts | 可运行实现与验证结果 | pending |
| review / integration thread | 复核 activity 是否越界替代 audit、approval、notification 或业务状态机 | 只读全局，必要时最小文档收口 | feature packet、contracts、实现结果 | review 结论与收口建议 | pending |

## 15. 验收标准

- 已明确 `ObjectActivity` owns / does-not-own。
- 已明确 `ObjectActivity` 与 `AuditLog` 的边界。
- 已明确与 `Comment / Mention / Attachment / Workflow / Approval / Notification` 的关系。
- 已冻结最小模型、phase 1 activity types 与降噪规则。
- 已冻结 phase 1 第一优先、第二优先、条件接入与后置对象。
- 后续 contract 线程无需重新讨论“activity 是否等于 audit”或“phase 1 是否必须先建中心服务”。
