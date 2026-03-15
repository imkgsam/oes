# Permission Service 变更历史

本文档用于记录 `permission-service` 的阶段性代码修改历史，便于后续持续追踪、回顾与审核。

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
