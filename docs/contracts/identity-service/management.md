# identity-service Management API

> 服务设计唯一真相源：[identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)。本文只描述黑盒 gRPC management 接口语义，不重新定义 `identity-service` 的长期职责、核心对象或 owner 边界。
> 管理入口涉及的 permission code、PermissionGuard 或授权判定语义，以 [permission-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/permission-service.md) 与项目级授权架构为准；本文只描述 identity-service management contract。

## 1. 接口范围

`IdentityManagementService` 提供管理型写接口：

- legacy 组织归属兼容管理
- Contact Asset 统一治理管理
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

## 3. Account management

### `CreateUserAccount`

- 作用：创建 `SYSTEM` 或 `TENANT` 账号；员工 onboarding 场景由 `hr-service` 通过内部 gRPC 调用该能力创建租户账号。
- 请求关键字段：
  - `scope_level`
  - `tenant_id`
  - `display_name`
  - `email` / `phone` / `existing_user_id`
  - optional `tenant_party_id`
- `tenant_party_id` 语义：
  - 仅适用于 `scope_level = TENANT`。
  - 当调用方传入 `tenant_party_id` 时，`identity-service` 必须把它作为 `UserAccount.tenantPartyId` 持久化，不得再注册新的 `TenantParty`。
  - 当调用方未传 `tenant_party_id` 时，`identity-service` 保留自行向 `party-service` 注册当前租户 `PERSON TenantParty` 的既有行为。
  - 当前 `identity-service` 尚无正式 Party query port；字段所属租户校验由上游受控写链路保证。若后续需要由 Identity 强校验，应先补充正式 Party query contract / ADR，不得运行时跨库查询。
- 与 HR binding 的关系：
  - HR employee onboarding 已解析出的 `Employee.tenantPartyId` 必须通过本字段传入。
  - 后续 `BindAccountToEmployee` 仍必须校验 `UserAccount.tenantPartyId == Employee.tenantPartyId`，不得为了 onboarding 成功而放宽一致性校验。

## 4. Contact Asset management

Contact Asset management 是管理员或受控 self-service 对账号工作上下文联系方式资产的 command 边界。

统一约束：

- Contact Asset owner、类型、状态、归属口径以 [identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md) 为准。
- `tenant_id + account_id` 是 Phase 1 主归属口径。
- `user_id` 是身份主体引用与查询辅助。
- `employee_id` 是当前分配对象或 HR lifecycle 协同引用，不是 Contact Asset owner。
- Contact Asset command 不创建 login method，不写认证 credential，不启用 OTP / MFA，不代表该联系方式可登录。
- 公司受控社交账号可以被回收、交接、停用或重新分配；员工个人联系方式引用不得被公司回收为公司资产。
- 所有会改变 Contact Asset 的管理命令都必须携带 operator context、trace context 与审计元数据。
- self-service 与 admin-management 必须使用不同入口或不同受控 command mode；self-service target 必须从当前 session / operator context 推导，不接受前端指定他人 target。

### 4.1 Shared management shapes

`ContactAssetMutationTarget`：

```json
{
  "tenantId": "tenant_001",
  "accountId": "acc_001",
  "userId": "user_001",
  "employeeId": "emp_001"
}
```

字段语义：

- `tenantId` 必填，用于租户边界与审计。
- `accountId` 必填，是 Contact Asset primary owner。
- `userId` 可由 identity-service 根据 `accountId` 校验或补齐；调用方传入时必须与账号归属一致。
- `employeeId` 可选，用于当前员工分配对象或 HR 协同校验。

`ContactAssetInput`：

```json
{
  "type": "WECHAT",
  "provider": null,
  "value": "wxid_example",
  "displayName": "Sales WeChat",
  "ownership": "COMPANY_CONTROLLED",
  "usage": ["BUSINESS_CARD", "WORK_CONTACT"],
  "isPrimary": false
}
```

字段语义：

- `type` 第一阶段支持 `WORK_EMAIL / WORK_PHONE / WECHAT / WHATSAPP / EXTERNAL_COMMUNICATION_ACCOUNT / OTHER_SOCIAL`。
- `provider` 用于 `EXTERNAL_COMMUNICATION_ACCOUNT`、`OTHER_SOCIAL` 或需要平台细分的社交资产。
- `value` 表示联系方式正文、handle 或 external reference；不得保存 OAuth token、refresh token、password、OTP secret 或外部平台 credential。
- `displayName` 是资产展示摘要，不是真实姓名或账号 display name 真相。
- `ownership` 第一阶段至少支持 `COMPANY_CONTROLLED / EMPLOYEE_OWNED`。
- `usage` 可表达 `BUSINESS_CARD / WORK_CONTACT / VCARD_CANDIDATE` 等用途，不表达登录可用性。
- `isPrimary` 表达账号工作联系方式主标记；BusinessCard 排序、公开范围和是否进入 vCard 仍由 BusinessCard 配置决定。

`ContactAssetManagementResult`：

```json
{
  "asset": {
    "contactAssetId": "ca_001",
    "tenantId": "tenant_001",
    "accountId": "acc_001",
    "userId": "user_001",
    "employeeId": "emp_001",
    "type": "WECHAT",
    "provider": null,
    "ownership": "COMPANY_CONTROLLED",
    "status": "ACTIVE",
    "isPrimary": false
  }
}
```

响应约束：

- 返回管理摘要，不返回敏感 credential、外部 OAuth token、内部审计正文或不可公开备注。
- 调用方如需 BusinessCard public render 值，应通过 query contract 的 `ResolveContactActionTargets` 解析。

### 4.2 Self-service profile boundary

#### `UpdateOwnUserBasicInfo`

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

#### `UpdateUserBasicInfo`

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

### 4.3 Unified Contact Asset commands

#### `AssignAccountContactAsset`

- 作用：为目标账号分配或登记一个 Contact Asset。
- 必要权限：
  - `identity.contact.asset.assign`
- 请求关键字段：
  - `target`
  - `assetInput`
  - `auditMetadata`
- 主要副作用：
  - 新增 Contact Asset 或建立当前账号分配关系。
  - 当 `isPrimary=true` 时，同类型主联系方式可能被切换。
  - 公司受控资产分配给新账号时，旧账号上的公司受控资产必须先满足释放、交接或停用规则。
- 边界：
  - 不创建 login method。
  - 不校验或保存认证凭据。
  - 不承接外部通信平台账号 lifecycle。

#### `UpdateAccountContactAssetSummary`

- 作用：更新 Contact Asset 的展示摘要、usage 或可管理的非 credential 字段。
- 必要权限：
  - `identity.contact.asset.update`
- 请求关键字段：
  - `contact_asset_id`
  - `display_name`
  - `provider`
  - `value`
  - `usage[]`
  - `auditMetadata`
- 关键语义：
  - 只允许更新 Contact Asset contract 允许的展示 / 联系摘要字段。
  - 不允许写入 password、OTP secret、OAuth token、refresh token 或外部 channel credential。
  - 员工个人联系方式引用的修改必须记录审计元数据。

#### `SetAccountContactAssetStatus`

- 作用：设置 Contact Asset 状态。
- 必要权限：
  - `identity.contact.asset.set_status`
- 请求关键字段：
  - `contact_asset_id`
  - `status`
  - `reason`
  - `auditMetadata`
- 状态语义：
  - `ACTIVE`：可作为当前账号有效联系资产，并可被 BusinessCard 解析为 public summary。
  - `PENDING_HANDOVER`：公司受控资产正在交接；public render 必须隐藏。
  - `DISABLED`：暂停使用；public render 必须隐藏。
  - `RELEASED`：从当前账号释放；public render 必须隐藏。
- 关键语义：
  - 状态变化应能影响 BusinessCard public render，但 BusinessCard 不复制 Contact Asset 状态。
  - `PENDING_HANDOVER / DISABLED / RELEASED` 不应被 `ResolveContactActionTargets` 解析出正文值。

#### `SetAccountPrimaryContactAsset`

- 作用：设置某账号某类型的主 Contact Asset。
- 必要权限：
  - `identity.contact.asset.set_primary`
- 请求关键字段：
  - `tenant_id`
  - `account_id`
  - `contact_asset_id`
  - `type`
  - `auditMetadata`
- 关键语义：
  - 只影响 identity-service 的账号工作联系方式主标记。
  - 不改变 BusinessCard action 的 `displayOrder / visibility / includeInVCard`。
  - 不表达 login primary method。

#### `ReleaseAccountContactAsset`

- 作用：从当前账号释放 Contact Asset。
- 必要权限：
  - `identity.contact.asset.release`
- 请求关键字段：
  - `contact_asset_id`
  - `reason`
  - `handoverTargetAccountId`
  - `auditMetadata`
- 关键语义：
  - 公司受控资产可释放、交接或停用。
  - 员工个人联系方式引用的移除表示解除 OES 内展示引用，不表示公司回收该外部账号。
  - 释放后资产不得继续出现在原账号 BusinessCard public render 中。

#### `StartContactAssetHandover`

- 作用：将公司受控 Contact Asset 标记为交接中。
- 必要权限：
  - `identity.contact.asset.handover`
- 请求关键字段：
  - `contact_asset_id`
  - `from_account_id`
  - `to_account_id`
  - `reason`
  - `auditMetadata`
- 关键语义：
  - 适用于公司受控社交账号、工作手机号等需人工交接的资产。
  - 进入 `PENDING_HANDOVER` 后，BusinessCard public render 必须隐藏对应 action。

#### `CompleteContactAssetHandover`

- 作用：完成公司受控 Contact Asset 交接并绑定到新账号。
- 必要权限：
  - `identity.contact.asset.handover`
- 请求关键字段：
  - `contact_asset_id`
  - `to_account_id`
  - `target_employee_id`
  - `status_after_handover`
  - `auditMetadata`
- 关键语义：
  - `status_after_handover` 通常为 `ACTIVE` 或 `DISABLED`。
  - 交接完成后，原账号不得再通过 `ResolveContactActionTargets` 获得该资产正文。

### 4.4 Legacy narrow work asset commands

以下 work email / work phone 接口是历史窄口径命令。它们的长期语义应视为统一 Contact Asset command 的兼容别名；新 BusinessCard Phase 1 设计不得继续扩展这些窄接口。

#### `AssignAccountWorkEmailAsset`

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
  - 兼容语义等价于 `AssignAccountContactAsset(type=WORK_EMAIL)`

#### `AssignAccountWorkPhoneAsset`

- 作用：为账户分配工作手机号资产
- 必要权限：
  - `identity.contact.work_phone.assign`
- 请求关键字段：
  - `account_id`
  - `phone`
  - `is_primary`
- 兼容语义：
  - 兼容语义等价于 `AssignAccountContactAsset(type=WORK_PHONE)`

#### `RevokeAccountWorkEmailAsset`

- 作用：撤销工作邮箱资产
- 必要权限：
  - `identity.contact.work_email.revoke`
- 请求关键字段：
  - `asset_id`
- 兼容语义：
  - 兼容语义等价于 `ReleaseAccountContactAsset(type=WORK_EMAIL)`

#### `RevokeAccountWorkPhoneAsset`

- 作用：撤销工作手机号资产
- 必要权限：
  - `identity.contact.work_phone.revoke`
- 请求关键字段：
  - `asset_id`
- 兼容语义：
  - 兼容语义等价于 `ReleaseAccountContactAsset(type=WORK_PHONE)`

#### `SetAccountWorkEmailAssetStatus`

- 作用：启用 / 停用工作邮箱资产
- 必要权限：
  - `identity.contact.work_email.set_status`
- 请求关键字段：
  - `asset_id`
  - `enabled`
- 兼容语义：
  - 兼容语义中 `enabled=true` 对应 `ACTIVE`，`enabled=false` 对应 `DISABLED`

#### `SetAccountWorkPhoneAssetStatus`

- 作用：启用 / 停用工作手机号资产
- 必要权限：
  - `identity.contact.work_phone.set_status`
- 请求关键字段：
  - `asset_id`
  - `enabled`
- 兼容语义：
  - 兼容语义中 `enabled=true` 对应 `ACTIVE`，`enabled=false` 对应 `DISABLED`

#### `SetAccountPrimaryWorkEmailAsset`

- 作用：切换主工作邮箱
- 必要权限：
  - `identity.contact.work_email.set_primary`
- 请求关键字段：
  - `asset_id`
- 关键语义：
  - 仅允许对工作邮箱资产生效
  - 兼容语义等价于 `SetAccountPrimaryContactAsset(type=WORK_EMAIL)`

#### `SetAccountPrimaryWorkPhoneAsset`

- 作用：切换主工作手机号
- 必要权限：
  - `identity.contact.work_phone.set_primary`
- 请求关键字段：
  - `asset_id`
- 关键语义：
  - 仅允许对工作手机号资产生效
  - 兼容语义等价于 `SetAccountPrimaryContactAsset(type=WORK_PHONE)`

## 5. 租户与组织边界

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
