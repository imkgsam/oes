# tenant-org-service Management API

> 服务设计唯一真相源：[tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md)。本文只描述黑盒 management contract，不重新定义 `Tenant / OrgUnit / org tree` 的长期职责或 owner 边界。
> 管理入口涉及的 PermissionGuard、permission code 或授权判定语义，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 与项目级授权架构为准。

## 1. 模块职责

`TenantOrgManagementService` 负责 tenant 与 org tree 的管理型写接口。

第一阶段适用场景：

- 创建 tenant
- 更新 tenant 基础信息
- 启停 / 归档 tenant
- 创建、更新、移动、归档组织节点

调用约束：

- 接口类型：内部服务接口
- 服务：`TenantOrgManagementService`
- 调用方：内部服务
- 必要 guard：
  - internal service
  - authenticated operator
  - `PermissionGuard`

## 2. 通用上下文要求

所有管理接口都要求：

- internal service 调用上下文
- operator context
- trace context
- 审计元数据

所有管理型写接口都必须产生可审计副作用。

## 3. Tenant 管理

### `CreateTenant`

- 作用：创建 tenant，并同步创建 root org
- 权限码：`tenant_org.tenant.create`
- 请求关键字段：
  - `code`
  - `name`
  - optional `root_org_name`
- 响应关键字段：
  - `tenant`
  - `root_org_unit`
- 主要副作用：
  - 创建 `Tenant`
  - 创建 root `OrgUnit`

### `UpdateTenantProfile`

- 作用：更新 tenant 基础信息
- 权限码：`tenant_org.tenant.update_profile`
- 请求关键字段：
  - `tenant_id`
  - `name`
  - optional `code`

### `SuspendTenant`

- 作用：停用 tenant
- 权限码：`tenant_org.tenant.update_status`
- 请求关键字段：
  - `tenant_id`
  - optional `reason`
- 跨服务副作用：
  - tenant status 成功变更为 `SUSPENDED` 后，必须调用 `auth-service.RevokeTenantSessions`
  - 撤销范围只包含该 `tenant_id` 下 `TENANT` scope active sessions
  - 不撤销 `SYSTEM` scope session，也不撤销其他 tenant session

### `ReactivateTenant`

- 作用：重新启用 tenant
- 权限码：`tenant_org.tenant.update_status`
- 请求关键字段：
  - `tenant_id`
- 跨服务副作用：
  - 不恢复历史 session
  - 用户如需进入该 tenant，必须重新登录或重新选择账号建立新 session

### `ArchiveTenant`

- 作用：归档 tenant
- 权限码：`tenant_org.tenant.update_status`
- 请求关键字段：
  - `tenant_id`
  - optional `reason`
- 跨服务副作用：
  - tenant status 成功变更为 `ARCHIVED` 后，必须调用 `auth-service.RevokeTenantSessions`
  - 撤销范围只包含该 `tenant_id` 下 `TENANT` scope active sessions
  - 不撤销 `SYSTEM` scope session，也不撤销其他 tenant session

## 4. OrgUnit 管理

### `CreateOrgUnit`

- 作用：创建组织节点
- 权限码：`tenant_org.org_unit.create`
- 请求关键字段：
  - `tenant_id`
  - `parent_org_id`
  - `name`
  - `type`
  - optional `sort_order`
  - optional `organization_tenant_party_id`
- `organization_tenant_party_id` 语义：
  - 表示该 `OrgUnit` 对 `party-service` 组织主体的可选正式引用；组织主体边界以 [party-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/party-service.md) 为准
  - 当前第一阶段仅允许 `type = ROOT | BRANCH` 时传入
  - `DEPARTMENT`、`TEAM`、`OTHER` 传入该字段时应返回 validation failure
- 写入前校验：
  - `tenant-org-service` 必须通过 `party-service` query 校验目标 party 存在
  - 目标 party 必须为 `ORGANIZATION`
  - 目标 party 必须处于可引用状态；当前第一阶段最小口径为 `ACTIVE`

### `UpdateOrgUnit`

- 作用：更新组织节点基础信息
- 权限码：`tenant_org.org_unit.update`
- 请求关键字段：
  - `tenant_id`
  - `org_unit_id`
  - optional `name`
  - optional `type`
  - optional `sort_order`
  - optional `organization_tenant_party_id`
- `organization_tenant_party_id` 语义：
  - 未提供时表示“不修改当前关联”
  - 提供非空值时表示“设置或替换当前 organizationTenantPartyId 引用”
  - 提供空值时表示“显式清空当前 organizationTenantPartyId 引用”
- 更新约束：
  - 若节点当前类型或更新后类型不属于 `ROOT | BRANCH`，则不得保留或写入 `organization_tenant_party_id`
  - 若本次更新同时修改 `type` 与 `organization_tenant_party_id`，以更新后的节点类型判断是否合法
  - 非空写入时沿用 `CreateOrgUnit` 的 party existence / type / status 校验

### `MoveOrgUnit`

- 作用：移动组织节点到新的父节点
- 权限码：`tenant_org.org_unit.update`
- 请求关键字段：
  - `tenant_id`
  - `org_unit_id`
  - `new_parent_org_id`
- 关键语义：
  - 不允许形成环
  - 必须同步更新路径与层级信息

### `ArchiveOrgUnit`

- 作用：归档组织节点
- 权限码：`tenant_org.org_unit.archive`
- 请求关键字段：
  - `tenant_id`
  - `org_unit_id`
  - optional `reason`
- 关键语义：
  - 第一阶段归档语义优先于物理删除

## 5. 主要错误语义

调用方应重点关注这几类失败：

- validation failure
  - 请求字段缺失或格式非法
- permission denied
  - operator 不具备 tenant 或 org 管理权限
- not found
  - tenant 或 org 不存在
- domain errors
  - 例如 code 冲突、根节点非法移动、形成环、状态不允许变更
  - organizationTenantPartyId 不存在、类型不是 `ORGANIZATION`、状态不可引用、或当前 org type 不允许持有该引用

## 6. 第一阶段明确不做

- 不提供 `AddAccountOrgMembership`
- 不提供 `RemoveAccountOrgMembership`
- 不提供 `SetAccountPrimaryOrg`
- 不提供 employee / employment 写接口；HR 写语义以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准
