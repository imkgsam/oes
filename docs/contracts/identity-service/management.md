# identity-service Management API

> 服务设计唯一真相源：[identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)。本文只描述黑盒 gRPC management 接口语义，不重新定义 `identity-service` 的长期职责、核心对象或 owner 边界。
> 管理入口涉及的 permission code、PermissionGuard 或授权判定语义，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 与项目级授权架构为准；本文只描述 identity-service management contract。

## 1. 接口范围

`IdentityManagementService` 提供管理型写接口：

- legacy 组织归属兼容管理
- 工作邮箱 / 工作手机号资产管理
- 机器账号与 API Key 管理

调用约束：

- 接口类型：gRPC
- 服务：`IdentityManagementService`
- 调用方：内部服务
- 必要 guard：
  - internal service
  - authenticated operator
  - permission guard

## 2. 通用上下文要求

所有管理接口都要求：

- internal service 调用上下文
- operator context
- `operator_id`
- 满足对应 permission code

当前权限解析链：

- 上游传递 `operator_roles`
- 子服务通过共享 resolver 调 `permission-service`
- 解析出 permission codes 后交给 `PermissionGuard`

## 3. 联系方式资产管理

### `UpdateOwnUserBasicInfo`

- 作用：更新当前认证账号所属用户的自助登录联系方式
- 必要上下文：
  - internal service
  - authenticated operator
- 请求关键字段：
  - `account_id`
  - `user_id`
  - `email` 或 `phone`
- 关键语义：
  - 这是 self-service 专用边界，不复用管理员资料权限
  - controller 必须校验 `operator_id == account_id`
  - handler 仍需校验 `account_id -> user_id` 归属关系与 tenant 资源边界

### `UpdateUserBasicInfo`

- 作用：由管理员更新目标账号所属用户的登录联系方式
- 必要权限：
  - `identity.account.profile.update`
- 请求关键字段：
  - `account_id`
  - `user_id`
  - `email` 或 `phone`
- 关键语义：
  - 这是 admin-management 专用边界
  - self-service 链路不得再复用该接口

### `AssignAccountWorkEmailAsset`

- 作用：为账户分配工作邮箱资产
- 必要权限：
  - `identity.contact.work_email.assign`
- 请求关键字段：
  - `account_id`
  - `email`
  - `is_primary`
- 主要副作用：
  - 新增邮箱资产
  - 当 `is_primary=true` 时，主邮箱归属可能被切换

### `AssignAccountWorkPhoneAsset`

- 作用：为账户分配工作手机号资产
- 必要权限：
  - `identity.contact.work_phone.assign`
- 请求关键字段：
  - `account_id`
  - `phone`
  - `is_primary`

### `RevokeAccountWorkEmailAsset`

- 作用：撤销工作邮箱资产
- 必要权限：
  - `identity.contact.work_email.revoke`
- 请求关键字段：
  - `asset_id`

### `RevokeAccountWorkPhoneAsset`

- 作用：撤销工作手机号资产
- 必要权限：
  - `identity.contact.work_phone.revoke`
- 请求关键字段：
  - `asset_id`

### `SetAccountWorkEmailAssetStatus`

- 作用：启用 / 停用工作邮箱资产
- 必要权限：
  - `identity.contact.work_email.set_status`
- 请求关键字段：
  - `asset_id`
  - `enabled`

### `SetAccountWorkPhoneAssetStatus`

- 作用：启用 / 停用工作手机号资产
- 必要权限：
  - `identity.contact.work_phone.set_status`
- 请求关键字段：
  - `asset_id`
  - `enabled`

### `SetAccountPrimaryWorkEmailAsset`

- 作用：切换主工作邮箱
- 必要权限：
  - `identity.contact.work_email.set_primary`
- 请求关键字段：
  - `asset_id`
- 关键语义：
  - 仅允许对工作邮箱资产生效

### `SetAccountPrimaryWorkPhoneAsset`

- 作用：切换主工作手机号
- 必要权限：
  - `identity.contact.work_phone.set_primary`
- 请求关键字段：
  - `asset_id`
- 关键语义：
  - 仅允许对工作手机号资产生效

## 4. 租户与组织边界

- `identity-service` 不再提供 `AddAccountOrgMembership`、`RemoveAccountOrgMembership`、`SetAccountPrimaryOrg`
- `identity-service` 创建 tenant-scope service account 时，只通过 `tenant-org-service` gRPC 校验 tenant 引用存在
- `Tenant / OrgUnit / org tree` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；本文只描述 identity 侧上下文引用与账号管理行为。
- `tenant_id` / `org_id` 可继续作为账号、联系资产、机器身份、审计记录的上下文引用字段
- 任何 tenant / org 真相读取必须走 `tenant-org-service`，不得通过共享数据库或 identity 本地模型解决

## 5. 机器身份管理

### `CreateServiceAccount`

- 作用：创建机器账号
- 必要权限：
  - `identity.machine.service_account.create`
- 请求关键字段：
  - `tenant_id`
  - `scope_level`
  - `type`
  - `name`
  - `description`
- 说明：
  - `tenant_id` 是否必需取决于 scope level

### `SetServiceAccountEnabled`

- 作用：启用 / 禁用机器账号
- 必要权限：
  - `identity.machine.service_account.set_status`
- 请求关键字段：
  - `service_account_id`
  - `enabled`

### `CreateApiKey`

- 作用：为机器账号创建 API Key
- 必要权限：
  - `identity.machine.api_key.create`
- 请求关键字段：
  - `service_account_id`
  - `expires_at`
- 响应关键字段：
  - `api_key`
  - `secret`
- 敏感信息约束：
  - `secret` 只在创建成功时返回一次

### `RevokeApiKey`

- 作用：撤销 API Key
- 必要权限：
  - `identity.machine.api_key.revoke`
- 请求关键字段：
  - `api_key_id`

### `RotateApiKey`

- 作用：轮换 API Key
- 必要权限：
  - `identity.machine.api_key.rotate`
- 请求关键字段：
  - `api_key_id`
  - `expires_at`
- 响应关键字段：
  - `api_key`
  - `secret`
- 敏感信息约束：
  - `secret` 只在轮换成功时返回一次

## 6. 主要错误语义

调用方应重点关注这几类失败：

- validation failure
  - 请求字段缺失或格式非法
- permission denied
  - operator 角色解析不到所需权限
- domain errors
  - 例如对象不存在、对象已撤销、状态不允许变更、跨租户绑定非法

## 7. 幂等性与副作用提示

- 查询接口无副作用，不在本文件范围内
- 大多数管理接口都有明确副作用，应由调用方以 command 语义使用
- `CreateApiKey / RotateApiKey` 会生成一次性 secret，调用方必须自行安全接收与保存
