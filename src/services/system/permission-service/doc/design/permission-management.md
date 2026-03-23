# Permission 管理

更新时间：2026-03-19 17:40:00 +08:00

## 目标

维护全局 `Permission` 模型，并为角色管理和 Policy 管理提供稳定的权限基础对象。

## 设计决策

- `Permission` 是全局模型，不按租户复制。
- `Permission.code` 应保持稳定，不作为常规可编辑字段开放。
- 权限列表查询统一收敛到分页主入口，旧的基础列表接口仅保留兼容用途。
- 后续系统管理员专属接口面需要覆盖全局 `Permission` 管理。

## 功能清单

| 功能编号 | 功能项 | 允许调用服务 | 允许操作者 | 优先级 | 状态 | 最后检查时间 | 备注 |
|---|---|---|---|---|---|---|---|
| 4.4.1 | 查看权限详情 | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 按 `ID / Code` 查询；已核查不存在时返回 `PERMISSION_NOT_FOUND` |
| 4.4.2 | 查看权限列表 | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 当前支持基础列表查询与按模块查询；分页与过滤已收敛到 `4.4.7` |
| 4.4.3 | 创建权限 | `gateway` | 系统管理员 | P0 | 已实现 | 2026-03-19 | 已核查；重复编码返回 `PERMISSION_ALREADY_EXISTS`，非法模块值进入 command 校验 |
| 4.4.4 | 修改权限 | `gateway` | 系统管理员 | P0 | 已实现 | 2026-03-19 | 当前支持修改 `module` 与 `description`，不开放修改 `code` |
| 4.4.5 | 删除权限 | `gateway` | 系统管理员 | P0 | 已实现 | 2026-03-19 | 当权限仍被角色或 Policy 引用时，返回 `PERMISSION_DELETE_FORBIDDEN` |
| 4.4.6 | 查看拥有该权限的角色 | `gateway` | 系统管理员、租户管理员 | P0 | 已实现 | 2026-03-19 | 已核查；权限不存在时返回 `PERMISSION_NOT_FOUND` |
| 4.4.7 | 权限列表分页与过滤 | `gateway` | 系统管理员、租户管理员 | P1 | 已实现 | 2026-03-19 | 新增 `ListPermissionsPaged` 作为统一主入口；支持 `page/pageSize + module + keyword`；旧 `ListPermissions` / `ListPermissionsByModule` 保留为兼容路径 |
| 4.4.8 | 批量创建权限 | `gateway` | 系统管理员 | P1 | 已实现 | 2026-03-19 | 新增 `BatchCreatePermissions`；整批事务语义；请求体内重复 `code` 或数据库已存在 `code` 时整批失败，并在异常 `details` 中返回具体冲突项 |
