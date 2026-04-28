# OES 服务协同审查清单

## 1. 文档目的

本文档用于给 architecture、plan、design、implementation、review 与 future audit 线程提供统一审查问题，帮助判断某个跨服务协作应走 `gRPC` 还是 `Event`，以及何时需要升级到更上层治理流程。

本清单不替代架构正文；协同边界真相以 `../architecture/service-collaboration-rules.md` 为准。

## 2. 使用范围

以下场景应使用本清单：

- 新增一个跨服务同步调用
- 新增一个业务事实事件
- 修改现有协同方式
- 为 feature packet 审查协同边界
- 为存量协作 audit 做分类与差距盘点

以下场景不应把本清单当作主工具：

- 单服务内部重构
- 纯代码风格讨论
- event broker 选型
- outbox 实现设计

## 3. 先判断这是不是“当前答案问题”

依次检查：

1. 这个调用是否需要当前答案？
2. 如果下游失败，当前 command 是否必须失败？
3. 这是事实扩散还是同步校验？
4. 是否有多个消费者？
5. 是否只是为了更新读模型 / 通知 / activity / BI？

默认判定：

- 前两题只要有一题为“是”，优先考虑 `gRPC`
- 后三题明显成立时，优先考虑 `Event`

## 4. `gRPC` 审查问题

当方案倾向 `gRPC` 时，继续检查：

- 下游返回结果是否真的是当前请求必须知道的 owner truth？
- 这次调用是否属于存在性、状态或权限前置校验？
- 这次调用是否属于 `api-gateway` / BFF 的同步聚合查询？
- 这次调用是否属于明确需要“已受理 / 已拒绝”结果的内部命令？
- 如果把这次调用改成事件，是否会让当前 command 失去明确成功 / 失败闭环？

若上述问题大多成立，保留 `gRPC` 设计。

## 5. `Event` 审查问题

当方案倾向 `Event` 时，继续检查：

- 源服务本地事务是否已经成功？
- 下游是否只是消费“已发生事实”而不是参与当前事务提交？
- 是否存在多个消费者，且它们彼此不应强耦合同步编排？
- 是否只是为了更新读模型、通知、activity、timeline、BI、analytics、search index 或 cache invalidation？
- 下游失败时，是否不应反过来否定源服务刚刚成功的本地事务？

若上述问题大多成立，保留 `Event` 设计。

## 6. 反模式检查

出现以下任一项，都应视为风险或直接不通过：

- 是否把事件写成了命令？
- 是否把 owner truth 复制进 payload？
- 是否试图依赖事件补齐本服务当前事务的必需数据？
- 是否把多个 `gRPC` 调用串成跨服务长事务？
- 是否让 `api-gateway` / BFF 承担跨域业务真相判断？
- 是否让下游消费者决定源服务事务是否算成功？

## 7. Payload 与上下文检查

无论走 `gRPC` 还是 `Event`，都必须检查：

- 是否显式携带 `tenantId`？
- 是否在场景适用时携带 `orgId`？
- 是否携带必要的 `operator context`？
- 是否携带 `trace context`？
- 是否保留必要审计元数据？
- 事件 payload 是否只带 ID 与必要快照？

## 8. 升级条件

满足以下任一项时，不应只停留在实现线程内处理：

- 该改动会改变 `gRPC / Event` 的项目级适用边界
- 该改动会改变事件命名语义或 payload 治理规则
- 该改动会改变租户、权限、operator context 或审计元数据传播规则
- 该改动需要引入新的跨服务长流程模式
- 该改动会要求多个服务同步调整契约或协同蓝图

升级路径：

1. 先回到 architecture thread 或 design thread 冻结规则
2. 再由 plan thread 拆分实施
3. 最后才进入 implementation / review

## 9. `SERVICE-COLLABORATION-AUDIT` 启动时机

以下条件同时满足时，再启动 `SERVICE-COLLABORATION-AUDIT` 最合适：

- 项目级协同规则已经冻结
- 用户明确要求盘点、分类或整改现有跨服务协作
- 需要为后续迁移计划、整改 backlog 或 feature packet 提供存量事实基础

以下情况暂不建议启动：

- 还在冻结项目级规则
- 还没有明确审查范围
- 只是单个 feature 在讨论是否走 `gRPC` 还是 `Event`

## 10. 下游引用要求

以下线程应优先引用本清单：

- `SERVICE-COLLABORATION-AUDIT`
- 涉及跨服务协同的 plan thread
- 涉及跨服务协同方案评审的 review thread
- 需要写 feature packet 协同审查段落的 design / plan thread
