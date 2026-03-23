# Auth Service 实施约束

更新时间：2026-03-22 18:35:00 +08:00

## 继承规范

`auth-service` 文档与代码改造默认继承以下仓库级规范：

- [microservice-architecture-reuse-guide.md](../../../../../doc/standards/microservice-architecture-reuse-guide.md)
- [requirements.md](../../../../../doc/standards/requirements.md)
- [doc-architecture-requirements.md](../../../../../doc/standards/doc-architecture-requirements.md)

## 当前阶段执行约束

- 当前阶段按最小闭环推进，一次只处理一个明确切片
- 当前优先级先恢复工程基线，再进入认证功能闭环
- 未经确认，不做横向重构，不跨多个功能分片同时推进

## 结构约束

- 目录结构逐步向 `permission-service` 的分层方式收敛
- `modules` 只负责装配，不承载核心业务规则
- `interfaces` 只做协议转换，不写复杂业务逻辑
- `application` 负责用例编排
- `domain` 不依赖 `infrastructure`
- `repository interface` 定义在 `domain`，实现放在 `infrastructure`

## 状态判定约束

- 只允许使用 `未开始`、`部分实现`、`已实现`
- 未完成全链路闭环前，不标记为 `已实现`
- 仅完成骨架恢复或编译基线恢复时，相关功能状态仍应保持 `未开始` 或 `部分实现`

## 文档约束

- `design` 与 `tasks` 必须双向关联
- 每个 `design/*.md` 必须使用 Markdown 表格维护“关联任务完成情况”
- 表格至少包含：任务编号、任务文档、当前状态、最近全局审核、备注
- `tasks` 默认按最小功能闭环拆分
- 每完成一个最小闭环切片，必须新增或更新对应 `history/*.history.md`
- 每完成一个最小闭环切片，必须同步更新一份全局审核记录，记录本次构建、接口、应用层、领域层、基础设施层和文档状态
- 涉及设计边界变化时先更新 `design`
- 涉及实施进度、阻塞项、验收变化时更新 `tasks`
