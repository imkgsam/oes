# Policy 管理

更新时间：2026-03-19 18:05:00 +08:00

## 目标

以 `Permission -> Policy` 为主入口收敛业务授权策略管理，并逐步替换当前过于灵活的策略暴露方式。

## 设计决策

- Policy 必须绑定明确的 `permissionCode`。
- Policy 主要表达业务授权条件，不承载全局入口风控。
- `permissionCode` 必须对应真实存在的 Permission。
- 当前模型下，Policy 不再作为其他领域对象的宿主对象，因此删除时不额外增加伪删除保护。
- Policy 审计事件后续统一纳入审计模块，不在本阶段重复设计。
- `4.5.8 / 4.5.9` 采用 `Permission -> Policy` 专用入口，不替代原有自由创建兼容入口。
- Policy 列表查询统一收敛到分页主入口，旧 `ListPolicies` 仅保留兼容用途。

## 功能清单

| 功能编号 | 功能项 | 允许调用服务 | 允许操作者 | 优先级 | 状态 | 最后检查时间 | 备注 |
|---|---|---|---|---|---|---|---|
| 4.5.1 | 查看 Policy 详情 | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 支持按 `id` 查询，不存在时返回 `POLICY_NOT_FOUND` |
| 4.5.2 | 查看 Policy 列表 | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 当前支持全量列表与按 `tenantId` 查询；分页与过滤已收敛到 `4.5.10` |
| 4.5.3 | 创建 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 创建时强制校验 `permissionCode` 存在 |
| 4.5.4 | 修改 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 修改时若更新 `permissionCode`，会校验目标 Permission 存在 |
| 4.5.5 | 删除 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 当前仅校验 Policy 存在性；审计待后续统一实现 |
| 4.5.6 | 启用/停用 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 支持显式设置 `isEnabled`，不存在时返回 `POLICY_NOT_FOUND` |
| 4.5.7 | 查看某权限关联的 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 支持按 `permissionCode` 和可选 `tenantId` 查询 |
| 4.5.8 | 为权限添加 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 新增 `AddPermissionPolicy`，以 Permission 为主入口创建 Policy |
| 4.5.9 | 为权限移除 Policy | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 新增 `RemovePermissionPolicy`，移除时校验 Policy 与 Permission 的绑定关系 |
| 4.5.10 | Policy 列表分页与过滤 | `gateway` | 系统管理员、租户管理员 | P1 | 已实现 | 2026-03-19 | 新增 `ListPoliciesPaged` 作为统一主入口；支持 `page/pageSize + tenantId + permissionCode + isEnabled + keyword`；关键字匹配 `name / description`；旧 `ListPolicies` 保留为兼容路径 |
| 4.5.11 | Policy 时间条件 | `gateway` | 系统管理员、租户管理员 | P1 | 未开始 |  |  |
| 4.5.12 | Policy 表达式校验 | `gateway` | 系统管理员、租户管理员 | P1 | 未开始 |  |  |
