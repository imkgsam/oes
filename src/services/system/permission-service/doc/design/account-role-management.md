# 账号角色管理

更新时间：2026-04-13 14:40:00 +08:00

## 目标

提供账号与角色实例绑定的完整管理闭环，并支持租户后台常见的“checkbox list 角色设置页面”。

## 设计决策

- 当前页面交互采用“全量同步角色集合”语义，而不是多次增量授予/撤销。
- `SetAccountRoles` 当前支持按 `scopeLevel` 设置系统范围或租户范围角色集合。
- 撤销不存在的账号角色绑定按幂等成功处理。
- 当前已在服务内补齐作用域保护；系统操作者可管理 `SYSTEM_INSTANCE`，非系统范围操作者只能访问和修改自己租户下的账号角色数据。
- `Phase 1` 不开放租户实例权限自定义。

## 角色授予有效期设计

### 使用场景

- 临时提权：例如某账号临时拥有租户管理员权限 2 天。
- 代班/轮岗：例如仓库主管请假一周，临时授予代理人相关角色。
- 预约生效：例如某账号的岗位变更从明天 00:00 开始生效。
- 自动过期回收：例如外部合作账号的角色仅在项目周期内有效。

### 数据模型

建议在 `AccountRole` 上新增两个可选字段：

- `effectiveAt: DateTime?`
- `expiresAt: DateTime?`

字段语义：

- `effectiveAt = null`
  - 表示立即生效
- `expiresAt = null`
  - 表示永不过期

### 生效规则

当前时间 `now` 满足以下条件时，该角色绑定视为有效：

- `effectiveAt is null` 或 `now >= effectiveAt`
- 且 `expiresAt is null` 或 `now < expiresAt`

边界规则：

- `effectiveAt` 含边界
- `expiresAt` 不含边界

### 合法性约束

- 当 `effectiveAt` 与 `expiresAt` 同时存在时，必须满足：
  - `effectiveAt < expiresAt`
- 不允许相等

### 第一阶段实施范围

`Phase 1` 先只改以下两类能力：

1. `AssignAccountRole`
- 支持授予时携带：
  - `effectiveAt`
  - `expiresAt`

2. 当前有效角色读取逻辑
- 所有“查询账号当前角色”的接口与 RBAC 读取逻辑，只返回“当前有效”的绑定

受影响的读取链路包括：

- `findRolesForAccountId`
- `findAccountRoles`
- `ListAccountRoles`
- `GetAccountRoleSelection`
- RBAC 鉴权使用的账号角色读取

### 暂不纳入第一阶段的能力

- 修改已有角色授予有效期
- 查询账号全部历史授予记录
- 查询即将过期的角色授予
- 过期通知 / 过期事件
- `SetAccountRoles` 支持时间窗口
- 审批流式临时授权

## 功能清单

| 功能编号 | 功能项 | 允许调用服务 | 允许操作者 | 优先级 | 状态 | 最后检查时间 | 备注 |
|---|---|---|---|---|---|---|---|
| 4.3.1 | 查看账号持有的角色 | `gateway` | 系统管理员 / 租户管理员 | P0 | 已实现 | 2026-04-13 | 按 `accountId + scopeLevel + tenantId` 查询当前有效角色 |
| 4.3.2 | 给账号授予角色 | `gateway` | 系统管理员 / 租户管理员 | P0 | 已实现 | 2026-04-13 | 单条绑定；支持可选 `effectiveAt/expiresAt`，按 `scopeLevel` 约束 system / tenant role |
| 4.3.3 | 撤销账号角色 | `gateway` | 系统管理员 / 租户管理员 | P0 | 已实现 | 2026-04-13 | 不存在绑定时幂等成功 |
| 4.3.4 | 获取账号角色选择列表 | `gateway` | 系统管理员 / 租户管理员 | P0 | 已实现 | 2026-04-13 | 返回 `availableRoles[] + selectedRoleIds[]` |
| 4.3.5 | 设置账号角色集合 | `gateway` | 系统管理员 / 租户管理员 | P0 | 已实现 | 2026-04-13 | checkbox list 页面保存入口，支持 system / tenant scope |
| 4.3.6 | 账号角色生效时间 | `gateway` | 系统管理员 / 租户管理员 | P1 | 已实现 | 2026-04-13 | 支持临时授权、预约生效、自动过期；`Phase 1` 已扩展 `AssignAccountRole` 和当前有效角色读取逻辑 |

## 待办问题

| 编号 | 问题 | 优先级 | 当前状态 | 备注 |
|---|---|---|---|---|
| TODO-4.3-01 | `AssignAccountRole` 需要同时支持系统范围与租户范围，并禁止 template 直接绑定账号 | P0 | 已实现 | 2026-04-13 已补齐 `SYSTEM_INSTANCE / TENANT_INSTANCE` 作用域约束，system binding 的 `tenantId` 允许为空，template 仍禁止直接绑定账号 |

## 分片实施建议

1. 在 `schema.prisma` 的 `AccountRole` 增加：
   - `effectiveAt`
   - `expiresAt`
2. 为 `AssignAccountRole` 的 contract / command / handler 增加时间字段与合法性校验
3. 将账号角色读取逻辑统一收敛为“只返回当前有效绑定”
4. 补基础测试与边界验证：
   - 立即生效
   - 未来生效
   - 到期失效
   - 永不过期
5. 后续再评估是否扩展到：
   - `SetAccountRoles`
   - 历史记录查询
   - 有效期修改
