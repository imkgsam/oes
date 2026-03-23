# Permission Service 文档索引

更新时间：2026-03-22 12:00:00 +08:00

本文档只作为 `permission-service` 的导航入口，不承载完整设计细节。当前有效设计、阶段说明和历史记录已经拆分到不同文档类型中。

## 阅读顺序

1. 先读 [overview.md](./overview.md)
2. 再读 [requirements.md](./requirements.md)
3. 然后读 [roadmap.md](./roadmap.md)
4. 按主题进入 `design/`
5. 需要演进记录时进入 `history/`

## 基础文档

| 文档 | 用途 |
|---|---|
| [overview.md](./overview.md) | 服务定位、边界、依赖关系、文档阅读方式 |
| [requirements.md](./requirements.md) | `permission-service` 继承和补充的实施约束 |
| [roadmap.md](./roadmap.md) | 当前阶段划分、优先级和实施顺序 |
| [design/core-model-migration-plan.md](./design/core-model-migration-plan.md) | 核心模型迁移计划与兼容性说明 |
| [../../../../../doc/standards/requirements.md](../../../../../doc/standards/requirements.md) | 仓库级 Codex 执行约束 |
| [../../../../../doc/standards/microservice-architecture-reuse-guide.md](../../../../../doc/standards/microservice-architecture-reuse-guide.md) | 其他子服务应遵循的统一微服务骨架与文档规范 |
| [../../../../../doc/cross-service/internal-service-auth-and-operator-context.md](../../../../../doc/cross-service/internal-service-auth-and-operator-context.md) | 跨服务功能总设计与总拆分，`permission-service` 需要按其中的分片要求落地 |
| [history/INDEX.md](./history/INDEX.md) | 功能集合历史索引 |
| [tasks/internal-service-auth-and-operator-context.md](./tasks/internal-service-auth-and-operator-context.md) | `permission-service` 对该跨服务功能的本服务落地分片与状态 |

## 功能设计索引

| 功能集合 | 当前阶段 | 优先级 | 当前状态 | 设计文档 | 历史文档 |
|---|---|---|---|---|---|
| 4.2 角色管理 | Phase 1 | P0 / P1 | 进行中 | [design/role-management.md](./design/role-management.md) | [history/role-management.history.md](./history/role-management.history.md) |
| 4.3 账号角色管理 | Phase 1 | P0 / P1 | 进行中 | [design/account-role-management.md](./design/account-role-management.md) | [history/account-role-management.history.md](./history/account-role-management.history.md) |
| 4.4 权限管理 | Phase 1 | P0 / P1 | 进行中 | [design/permission-management.md](./design/permission-management.md) | [history/permission-management.history.md](./history/permission-management.history.md) |
| 4.5 Policy 管理 | Phase 1 | P0 / P1 | 进行中 | [design/policy-management.md](./design/policy-management.md) | [history/policy-management.history.md](./history/policy-management.history.md) |
| 4.6 鉴权能力 | Phase 1 | P0 / P1 | 进行中 | [design/authorization.md](./design/authorization.md) | [history/authorization.history.md](./history/authorization.history.md) |

## 文档使用规则

- 稳定设计结论统一写入 `design/*.md`
- 阶段说明、实施顺序和待办切片统一写入 [roadmap.md](./roadmap.md) 或后续 `tasks/*.md`
- 历史变更统一写入 `history/*.history.md`
- 跨服务功能主文档不在本目录重复展开，统一引用根目录 `doc/`，本服务只维护自己的落地任务文档
- 其中 [design/authorization.md](./design/authorization.md) 是根目录跨服务功能在 `permission-service` 内的设计承接文档，[tasks/internal-service-auth-and-operator-context.md](./tasks/internal-service-auth-and-operator-context.md) 是对应实施文档
