# Permission Service 变更历史

本文档用于记录 `permission-service` 的阶段性代码修改历史，便于后续持续追踪、回顾与审核。

## 2026-03-17 17:58 +08:00

### 本次目标

将 `Role template / instance` 的使用场景、权限策略和后续实现阶段明确写入 checklist，避免后续实现时语义反复变化。

### 修改范围

- checklist 文档
- 变更历史文档

### 主要改动

- 在“已确认设计决策”中补充了模板/实例的明确规则：
  - `SYSTEM_TEMPLATE` 必须预置标准权限组合
  - `TENANT_INSTANCE` 创建时复制模板权限
  - 模板角色不允许直接授予账号
  - `Phase 1` 不开放租户管理员直接修改模板生成的实例权限
  - 后续若开放实例权限自定义，需要显式标记该实例已偏离模板
- 在 `4.2 角色管理` 中新增 3 个 `P1` 设计项：
  - `系统模板角色管理`
  - `基于模板创建租户角色实例`
  - `租户实例权限自定义`
- 将每一项的使用场景和阶段策略写入备注

### 兼容性影响

- 本次仅更新文档设计，不改业务代码
- 无运行时兼容性风险

### 验证结果

- 本次仅做设计收敛与 checklist 更新，未涉及代码编译验证

### 备注

- 当前系统已经部分体现该模型边界：
  - 账号角色分配只允许使用租户实例角色
- 但模板管理、模板实例化、实例权限偏离模板的治理能力仍属于后续 `P1`

## 2026-03-17 12:15 +08:00

### 本次目标

一次性实现 `4.3 账号角色管理` 下两个页面闭环分片：

- 获取账号角色选择列表
- 设置账号角色集合

### 修改范围

- `permission_management.proto`
- `management.port.ts`
- `role` 相关 query/command/handler
- `RoleRepository` 与 Prisma 仓储实现
- gRPC role 管理控制器
- checklist 与变更历史文档

### 主要改动

- 新增 `GetAccountRoleSelection` RPC
- 新增 `SetAccountRoles` RPC
- 新增消息：
  - `GetAccountRoleSelectionRequest`
  - `AccountRoleSelectionResponse`
  - `SetAccountRolesRequest`
- 在 `PermissionManagementPort` 中补充：
  - `getAccountRoleSelection(...)`
  - `setAccountRoles(...)`
- 新增查询：
  - `get-account-role-selection.query.ts`
  - `get-account-role-selection.handler.ts`
- 新增命令：
  - `set-account-roles.command.ts`
  - `set-account-roles.handler.ts`
- 在 `RoleRepository` 中新增：
  - `findTenantRoles(tenantId)`
  - `replaceAccountRoles(accountId, tenantId, accountType, roleIds)`
- 在 Prisma 仓储中实现：
  - 按租户查询角色列表
  - 事务型全量同步账号角色集合
- `GetAccountRoleSelection` 当前返回：
  - `availableRoles[]`
  - `selectedRoleIds[]`
- `SetAccountRoles` 当前行为：
  - 仅支持单个账号
  - 按提交结果全量同步当前租户下的账号角色集合
  - 仅允许设置当前租户的租户实例角色
  - 非当前租户角色或系统模板角色会被拒绝

### 兼容性影响

- 本次为新增接口，不破坏现有账号角色单条授予/撤销能力
- “仅租户管理员可调用”当前未在 `permission-service` 服务层内做操作者身份校验
- 该限制目前依赖上层 gateway / guard / 鉴权策略保证

### 验证结果

已执行：

```powershell
pnpm proto:gen
pnpm --filter @oes/common build
pnpm --filter permission-service build
```

结果：
- proto 生成通过
- `@oes/common` 构建通过
- `permission-service` 构建通过

### 备注

- `GetAccountRoleSelection` 当前返回的是当前租户角色全集，不额外过滤禁用角色
- 页面如果需要禁用不可选角色，可直接使用返回的 `RoleResponse.isEnabled`
- 这两个分片完成后，`4.3` 当前 `P0` 范围已全部打通

## 2026-03-17 12:15 +08:00

### 本次目标

根据页面交互方式，收敛 `4.3 账号角色管理` 中原“批量授予/撤销角色”的设计，并拆分为更适合前端使用的两个明确分片。

### 修改范围

- checklist 文档
- 变更历史文档

### 主要改动

- 取消原来的“批量授予/撤销角色”表述
- 将其收敛为两个新的 `P0` 分片：
  - `获取账号角色选择列表`
  - `设置账号角色集合`
- 明确页面语义：
  - checkbox 勾选表示应持有该角色
  - 未勾选表示应撤销该角色
  - 点击更新后按最终角色集合做一次全量同步
- 明确适用范围：
  - 仅用于单个账号
  - 仅由租户管理员使用
- 明确查询接口建议返回：
  - `availableRoles[]`
  - `selectedRoleIds[]`
- 明确保存接口建议采用：
  - `SetAccountRoles`
  - 全量同步语义

### 兼容性影响

- 本次仅更新文档设计，不改业务代码
- 无运行时兼容性风险

### 验证结果

- 本次仅做设计收敛与 checklist 更新，未涉及代码编译验证

### 备注

- 后续代码实现前，应从这两个新分片中按顺序选择一个先做
- 更合理的顺序是先实现“获取账号角色选择列表”，再实现“设置账号角色集合”

## 2026-03-17 12:04 +08:00

### 本次目标

收敛“撤销账号角色”的边界行为，并按已确认方案将其实现为幂等删除。

### 修改范围

- Prisma 账号角色仓储实现
- checklist 文档
- 变更历史文档

### 主要改动

- 根据已确认方案，将“解绑不存在的账号角色绑定”定义为幂等成功
- 在 Prisma 仓储中将 `revokeAccountRole` 从 `delete(...)` 调整为 `deleteMany(...)`
- 避免不存在绑定时透出底层 Prisma 持久化异常
- 将 checklist 中“撤销账号角色”从“部分实现”更新为“已实现”

### 兼容性影响

- 这是边界行为调整
- 之前对不存在绑定执行撤销会抛底层异常
- 现在改为直接成功返回，更适合作为稳定服务契约

### 验证结果

已执行：

```powershell
pnpm --filter permission-service build
```

结果：
- `permission-service` 构建通过

### 备注

- `4.3` 中 3 个原有 `P0` 能力现在都已完成核查
- 下一个待推进的 `P0` 分片是“单个账号批量授予/撤销多个角色”

## 2026-03-17 11:53 +08:00

### 本次目标

继续核查 `4.3 账号角色管理` 的已标记功能，并把批量账号角色操作的优先级与范围更新到 checklist。

### 修改范围

- checklist 文档
- 变更历史文档

### 主要改动

- 将“批量授予/撤销角色”从 `P1` 调整为 `P0`
- 将该能力的范围明确为：
  - 单个账号批量授予多个角色
  - 单个账号批量撤销多个角色
- 明确暂不包含：
  - 多个账号批量授予同一角色
  - 多账号多角色矩阵式批量操作
- 核查“给账号授予角色”完整链路：
  - proto 契约
  - gRPC controller
  - command
  - handler
  - repository
- 将“给账号授予角色”更新为已核查状态
- 核查“撤销账号角色”后，发现当前实现对不存在绑定会透出底层 Prisma 异常，因此先调整为“部分实现”，等待语义确认后再收敛

### 兼容性影响

- 本次不改业务代码，只更新文档状态和优先级
- 无运行时兼容性风险

### 验证结果

已执行：

```powershell
pnpm --filter permission-service build
```

结果：
- `permission-service` 构建通过

### 备注

- `4.3` 中“查看账号持有的角色”与“给账号授予角色”已完成核查
- “撤销账号角色”还差一个行为约定：解绑不存在绑定时，应该幂等成功，还是明确报业务错误

## 2026-03-17 11:53 +08:00

### 本次目标

收敛 `4.3 账号角色管理` 的 checklist 描述，移除重复能力项，并核查“查看账号持有的角色”是否已完整实现。

### 修改范围

- checklist 文档
- 变更历史文档

### 主要改动

- 确认 `4.3` 中“查看角色下有哪些账号”与 `4.2` 中已实现的 `ListRoleAccounts` 属于同一能力
- 按当前确认结果，从 `4.3` 中移除该重复项
- 核查“查看账号持有的角色”完整链路：
  - proto 契约
  - gRPC controller
  - query
  - repository
- 在 checklist 中将“查看账号持有的角色”补充为已核查状态
- 对“批量授予/撤销角色”补充实现范围建议：
  - V1 优先做单个账号批量授予/撤销多个角色
  - 暂不做多个账号批量授予同一角色或矩阵式批量操作

### 兼容性影响

- 本次不改业务代码，只更新文档状态与范围定义
- 无运行时兼容性风险

### 验证结果

已执行：

```powershell
pnpm --filter permission-service build
```

结果：
- `permission-service` 构建通过

### 备注

- 后续继续推进 `4.3` 时，下一个需要核查的 `P0` 项是“给账号授予角色”

## 2026-03-15 23:23 +08:00

### 本次目标

核查“为角色移除权限”功能是否已完整实现，并同步更新开发跟踪文档。

### 修改范围

- checklist 文档
- 变更历史文档

### 主要改动

- 检查了 `RevokeRolePermission` 的完整链路：
  - proto 契约
  - gRPC controller
  - command
  - handler
  - `Role` 聚合的移除逻辑
  - repository `save` 的关系删除逻辑
- 确认该功能当前已完整可用
- 在 checklist 中补充了已核查时间与说明

### 兼容性影响

- 本次不改业务代码，只更新文档状态
- 无运行时兼容性风险

### 验证结果

已执行：

```powershell
pnpm --filter permission-service build
```

结果：
- `permission-service` 构建通过

### 备注

- 当前移除一个并不存在的角色权限绑定时，会保持幂等，不会报错
- 若继续按 `4.2` 顺序推进，下一条未完成切片是“角色授予有效期”

## 2026-03-15 23:21 +08:00

### 本次目标

核查“为角色添加权限”功能是否已完整实现，并同步更新开发跟踪文档。

### 修改范围

- checklist 文档
- 变更历史文档

### 主要改动

- 检查了 `AssignRolePermission` 的完整链路：
  - proto 契约
  - gRPC controller
  - command
  - handler
  - `Role` 聚合的去重逻辑
  - repository `save` 的持久化逻辑
- 确认该功能当前已完整可用
- 在 checklist 中补充了已核查时间与说明

### 兼容性影响

- 本次不改业务代码，只更新文档状态
- 无运行时兼容性风险

### 验证结果

已执行：

```powershell
pnpm --filter permission-service build
```

结果：
- `permission-service` 构建通过

### 备注

- 当前重复为角色绑定同一权限时，会由 `Role` 聚合中的 `hasPermissionById` 去重
- 后续下一条顺序切片将继续核查“为角色移除权限”

## 2026-03-15 23:08 +08:00

### 本次目标

实现“查看持有该角色的账号”能力，补齐从 gRPC 契约到查询处理的完整链路。

### 修改范围

- `permission_management.proto`
- `management.port.ts`
- `role` 相关 query/handler
- `RoleRepository` 与 Prisma 仓储实现
- gRPC role 管理控制器
- checklist 与变更历史文档

### 主要改动

- 新增 `ListRoleAccounts` RPC
- 新增：
  - `ListRoleAccountsRequest`
  - `AccountRoleBindingResponse`
  - `ListRoleAccountsResponse`
- 在 `PermissionManagementPort` 中补充 `listRoleAccounts`
- 在 `RoleRepository` 中新增 `findRoleAccounts(roleId)`
- 在 Prisma 仓储中实现按 `roleId` 查询账号绑定关系
- 新增：
  - `list-role-accounts.query.ts`
  - `list-role-accounts.handler.ts`
- 在 gRPC controller 中新增 `listRoleAccounts(...)`
- 当前返回账号绑定关系的基础字段：
  - `accountId`
  - `accountType`
  - `roleId`
  - `tenantId`
- 对不存在的角色显式抛出 `ROLE_NOT_FOUND`
- 更新 checklist 中“查看持有该角色的账号”的状态为已实现

### 兼容性影响

- 本次为新增查询能力，不破坏现有角色、权限、账号角色绑定接口
- 当前只返回账号绑定关系，不包含账号名称、显示名等外部账号详情

### 验证结果

已执行：

```powershell
pnpm proto:gen
pnpm --filter @oes/common build
pnpm --filter permission-service build
```

结果：
- proto 生成通过
- `@oes/common` 构建通过
- `permission-service` 构建通过

### 备注

- 本切片只实现“角色 -> 账号绑定关系”的查询闭环
- 若后续需要展示账号名称等信息，建议通过账号服务聚合或另行扩展返回模型

## 2026-03-15 22:59 +08:00

### 本次目标

实现“查看角色持有的权限”能力，补齐从 gRPC 契约到查询处理的完整链路。

### 修改范围

- `permission_management.proto`
- `management.port.ts`
- `role` 相关 query/handler
- gRPC role 管理控制器
- checklist 与变更历史文档

### 主要改动

- 新增 `ListRolePermissions` RPC
- 新增 `ListRolePermissionsRequest`
- 在 `PermissionManagementPort` 中补充 `listRolePermissions`
- 新增：
  - `list-role-permissions.query.ts`
  - `list-role-permissions.handler.ts`
- 在 gRPC controller 中新增 `listRolePermissions(...)`
- 复用仓储层现有 `findOwnPermissions(roleId)` 查询角色直接绑定权限
- 对不存在的角色显式抛出 `ROLE_NOT_FOUND`，避免返回含糊的空列表
- 更新 checklist 中“查看角色持有的权限”的状态为已实现

### 兼容性影响

- 本次为新增查询能力，不破坏现有角色、权限、绑定关系接口
- 当前返回的是角色“直接绑定”的权限列表，不包含任何推导权限或继承权限

### 验证结果

已执行：

```powershell
pnpm proto:gen
pnpm --filter @oes/common build
pnpm --filter permission-service build
```

结果：
- proto 生成通过
- `@oes/common` 构建通过
- `permission-service` 构建通过

### 备注

- 本切片只实现“角色 -> 直接权限”的查询闭环
- “查看持有该角色的账号”将作为后续独立切片继续推进

## 2026-03-15 22:55 +08:00

### 本次目标

实现角色启用/停用能力，补齐从 gRPC 契约到应用层命令处理的完整链路。

### 修改范围

- `permission_management.proto`
- `management.port.ts`
- `role` 相关 command/handler
- gRPC role 管理控制器
- checklist 与变更历史文档

### 主要改动

- 为角色管理新增 `SetRoleEnabled` RPC
- 新增 `SetRoleEnabledRequest`
- 在 `PermissionManagementPort` 中补充 `setRoleEnabled`
- 新增：
  - `set-role-enabled.command.ts`
  - `set-role-enabled.handler.ts`
- 在 gRPC controller 中新增 `setRoleEnabled(...)`
- 复用 `Role` 聚合现有的 `enable()` / `disable()` 方法切换 `isEnabled`
- 更新 checklist 中“启用/停用角色”的状态为已实现

### 兼容性影响

- 本次为新增能力，不破坏现有角色创建、查询、修改、删除接口
- 角色禁用后的具体鉴权行为仍依赖现有查询/鉴权逻辑，这次不额外改动鉴权层

### 验证结果

已执行：

```powershell
pnpm proto:gen
pnpm --filter @oes/common build
pnpm --filter permission-service build
```

结果：

- proto 生成通过
- `@oes/common` 构建通过
- `permission-service` 构建通过

### 备注

- 当前切片只负责角色启停链路打通，不包含审计事件记录

## 2026-03-15 22:40 +08:00

### 本次目标

将异常定义从单文件聚合形式拆分为按领域分类的多个文件，同时保持现有代码可编译、可继续迭代。

### 修改范围

- `exception-enums` 目录结构调整
- 现有业务代码中的异常定义导入路径调整
- 保留旧兼容入口并标记为过时

### 主要改动

- 将异常定义拆分为以下文件：
  - `role.errors.ts`
  - `permission.errors.ts`
  - `policy.errors.ts`
  - `authorization.errors.ts`
  - `account-role.errors.ts`
- 新增统一聚合出口：
  - `exception-enums/index.ts`
- 将当前业务代码中的异常导入切换为新的聚合出口
- 保留旧文件 `permission-service.errors.ts` 作为兼容桥接文件
- 在旧文件中加入 `OUTDATED` 注释，等待后续审核删除

### 兼容性影响

- 本次不改变异常码，也不改变异常语义
- 仅调整异常定义文件的组织方式
- 由于旧兼容文件仍保留，短期内不会因为旧引用残留而导致运行失败

### 验证结果

已执行：

```powershell
pnpm --filter permission-service build
```

结果：

- 构建通过
- 当前服务源码中已不再有业务代码直接依赖旧异常文件路径

### 备注

- 旧文件 `permission-service.errors.ts` 后续可在确认无兼容需求后删除
