# Permission Service 文档索引

更新时间：2026-03-19 10:16:12 +08:00

本文档只作为 `permission-service` 文档索引使用，不再承载完整设计细节。

## 基础文档

| 文档 | 说明 |
|---|---|
| [CORE_MODEL_MIGRATION_PLAN.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/CORE_MODEL_MIGRATION_PLAN.md) | 核心模型迁移计划与兼容性说明 |
| [HISTORY.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/HISTORY.md) | 功能集合历史索引 |

## 功能集合索引

| 功能集合 | 当前阶段 | 优先级 | 当前状态 | 主文档 | 历史文档 |
|---|---|---|---|---|---|
| 4.2 角色管理 | Phase 1 | P0 / P1 | 进行中 | [role-management.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/role-management.md) | [role-management.history.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/role-management.history.md) |
| 4.3 账号角色管理 | Phase 1 | P0 / P1 | 进行中 | [account-role-management.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/account-role-management.md) | [account-role-management.history.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/account-role-management.history.md) |
| 4.4 权限管理 | Phase 1 | P0 / P1 | 进行中 | [permission-management.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/permission-management.md) | [permission-management.history.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/permission-management.history.md) |
| 4.5 Policy 管理 | Phase 1 | P0 / P1 | 进行中 | [policy-management.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/policy-management.md) | [policy-management.history.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/policy-management.history.md) |
| 4.6 鉴权能力 | Phase 1 | P0 / P1 | 进行中 | [authorization.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/authorization.md) | [authorization.history.md](D:/user/vic/code/code_base/on/oes/src/services/system/permission-service/doc/func/authorization.history.md) |

## 已确认的全局决策

- `Role` 采用 `SYSTEM_TEMPLATE + TENANT_INSTANCE` 模型。
- `Policy` 以 `Permission` 为核心挂载对象。
- `permission-service` 只承载业务授权，不承载入口级风控。
- 租户管理员继续使用现有 `PermissionManagementService`。
- 系统管理员后续新增专属接口面，不与租户侧接口混用。
- 需要在服务内做接口访问控制，不能只依赖外层网关。

## 使用规则

- 细节设计、分片步骤、操作者约束，统一写入各功能集合主文档。
- 每次改动后，优先更新对应功能集合的历史文档。
- 跨模块设计不要写在本索引中，统一放仓库根目录 `doc`。
