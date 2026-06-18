# identity-service Query API

> 服务设计唯一真相源：[identity-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/identity-service.md)。涉及 HR `Employee / Employment`、员工生命周期或正式 `人 -> org` 归属时，以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准。本文只描述黑盒 gRPC query 接口语义，不重新定义 `identity-service` 或 HR 的长期职责、核心对象或 owner 边界。

## 1. 接口范围

`IdentityQueryService` 提供只读身份查询接口，不修改状态。

适用场景：

- 登录后账户候选查询
- 按邮箱 / 手机 / 用户 ID 查询自然人身份
- 按账户 ID 查询账号摘要
- 查询联系方式资产
- 查询机器身份与 API Key 摘要

调用约束：

- 接口类型：gRPC
- 服务：`IdentityQueryService`
- 调用方：内部服务
- 权限要求：当前无细粒度 permission guard
- operator context：查询侧当前不强制要求

## 2. 用户与账户查询

### 用户标识语义

- `user.id` 是 identity 用户的稳定技术标识。
- `user.username` 是历史字段，当前只能按可选 login handle 理解。
- `user.username` 不是真实姓名、法定姓名、昵称或展示名真相源。
- 如后续需要唯一用户名登录，应先冻结 login handle 语义，再新增或调整契约。
- 如后续需要真实姓名搜索，应通过 `party-service` 的自然人主体模型协同设计，不在 `identity-service` query 中直接扩展姓名模糊搜索。

### `GetUserById`

- 作用：按 `userId` 查询自然人身份摘要
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `user.id`
  - `user.username`
  - `user.personal_email`
  - `user.personal_phone`
  - `user.is_active`
- 说明：
  - `User` 是技术身份，不持有 `partyId`。
  - 管理端若需要租户内稳定的人名展示，应从当前租户 `UserAccount.tenantPartyId` 出发，联动 `party-service` 读取 `TenantParty.displayName / legalName`。
  - `user.username` 仍只作为历史 login handle 回传，不应再被理解为真实姓名真相
- 返回空语义：
  - 用户不存在时返回空响应对象

### `GetUserByEmail`

- 作用：按个人邮箱查询自然人身份摘要
- 请求关键字段：
  - `email`
- 响应关键字段：同 `GetUserById`
- 返回空语义：
  - 未匹配时返回空响应对象

### `GetUserByPhone`

- 作用：按个人手机号查询自然人身份摘要
- 请求关键字段：
  - `phone`
- 响应关键字段：同 `GetUserById`
- 返回空语义：
  - 未匹配时返回空响应对象

### `GetAccountsByUserId`

- 作用：查询某个自然人可选择的账户列表
- 请求关键字段：
  - `user_id`
- 响应关键字段：
  - `accounts[].account_id`
  - `accounts[].tenant_id`
  - `accounts[].display_name`
- 说明：
  - 适合 `auth-service` 登录后账户选择场景
  - `tenant_id` 只表示 account context 绑定的 tenant 引用，不表示 tenant 真相
  - 如调用方仍需要 tenant 名称，应再通过 `tenant-org-service` 按 `tenant_id` 聚合补水

### `GetAccountById`

- 作用：按账户 ID 查询账户摘要
- 请求关键字段：
  - `account_id`
- 响应关键字段：
  - `account.id`
  - `account.user_id`
  - `account.tenant_id`
  - `account.display_name`
  - `account.is_enabled`
- 返回空语义：
  - 未匹配时返回空响应对象

### `ListAccounts`

- 作用：按当前操作者可见范围列出分页账号目录
- 请求关键字段：
  - `keyword`
  - `scope_level`
  - `status`
  - `page`
  - `page_size`
- 响应关键字段：
  - `accounts[].account_id`
  - `accounts[].user_id`
  - `accounts[].tenant_id`
  - `accounts[].tenant_party_id`
  - `accounts[].scope_level`
  - `accounts[].display_name`
  - `accounts[].user_display_name`
  - `accounts[].is_enabled`
  - `total`
- 过滤语义：
  - `keyword` 可匹配账号 ID、用户 ID、显示名、用户名、邮箱、手机号
  - `scope_level` 当前支持 `SYSTEM / TENANT`
  - `status` 当前支持 `ENABLED / DISABLED`
- 作用域约束：
  - system scope 可列出全局可见账号
  - tenant-bound operator 仅列出本 tenant 可见账号
  - tenant 边界由 query scope builder 收敛，不依赖调用方自行传 `tenant_id`
- 排序与分页：
  - 当前实现按 `createdAt desc, id desc`
  - `page` 为 1-based；`page_size` 默认 20，最大 100
- 第一阶段边界：
  - 当前只覆盖 `USER` account 目录
  - 不返回角色、组织归属、会话状态等详情
- 展示语义：
  - `accounts[].display_name` 是 account 上下文显示名
  - `accounts[].tenant_id` 只表示 tenant 引用，tenant 标签应由调用方再向 `tenant-org-service` 聚合
  - `accounts[].tenant_party_id` 是当前账号在该租户内关联的 `TenantParty`，可用于租户内人员展示聚合
  - `accounts[].user_display_name` 当前仅作为 legacy fallback，不应再被当作长期真实姓名来源

## 3. 租户与组织边界

- `identity-service` 不再暴露 `GetOrgTreeByTenantId` 或 `ListAccountOrgMemberships`
- tenant / org tree 真相由 `tenant-org-service` 提供
- `Tenant / OrgUnit / org tree` 边界以 [tenant-org-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/tenant-org-service.md) 为准；本文只描述 identity query 对 tenant/org 引用的消费方式。
- 人员正式组织归属应由 `hr-service` 的 employment 语义承接，具体以 [hr-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/hr-service.md) 为准，不在 identity account projection 中继续维护
- `tenant_id` / `org_id` 在 identity 查询中只作为上下文、审计或外部 owner 引用字段出现

## 4. 联系方式资产查询

### 4.1 Shared Contact Asset shapes

Contact Asset query shapes 只描述调用方可消费的黑盒字段，不暴露 `identity-service` 内部持久化模型。

`ContactAssetRef`：

```json
{
  "targetRefType": "CONTACT_ASSET",
  "targetRefId": "ca_001"
}
```

字段语义：

- `targetRefType` 表示引用来源类型。
- `CONTACT_ASSET` 指向 `identity-service` Contact Asset。
- `NONE` 可用于 `SAVE_VCARD` 等不引用单一 Contact Asset 的动作，但 `ResolveContactActionTargets` 不会为 `NONE` 返回联系方式正文。
- `TENANT_PUBLIC_PROFILE` 不属于个人 Contact Asset；公司官网等能力应由 BusinessCard / Public Entry 通过 tenant/company profile 边界解析。
- `targetRefId` 是 Contact Asset id；调用方不得从该 id 推断 tenant、account、employee 或联系方式正文。

`ContactAssetSummary`：

```json
{
  "contactAssetId": "ca_001",
  "tenantId": "tenant_001",
  "accountId": "acc_001",
  "userId": "user_001",
  "employeeId": "emp_001",
  "type": "WORK_PHONE",
  "provider": null,
  "ownership": "COMPANY_CONTROLLED",
  "status": "ACTIVE",
  "isPrimary": true,
  "displayLabel": "Work phone",
  "displayValue": "+1 555 123 4567",
  "assignedAt": "2026-06-08T02:20:00+08:00",
  "releasedAt": null
}
```

字段语义：

- `tenantId + accountId` 是 Phase 1 查询与归属限定口径。
- `userId` 是身份主体引用与查询辅助。
- `employeeId` 是当前分配对象或 HR lifecycle 协同引用，不是 Contact Asset owner。
- `type` 第一阶段支持 `WORK_EMAIL / WORK_PHONE / WECHAT / WHATSAPP / EXTERNAL_COMMUNICATION_ACCOUNT / OTHER_SOCIAL`。
- `provider` 用于 `EXTERNAL_COMMUNICATION_ACCOUNT`、`OTHER_SOCIAL` 或需要区分平台的社交资产，例如 `WE_COM / FEISHU / DINGTALK`。
- `ownership` 第一阶段至少区分 `COMPANY_CONTROLLED / EMPLOYEE_OWNED`。
- `status` 第一阶段支持 `ACTIVE / PENDING_HANDOVER / DISABLED / RELEASED`。
- `displayValue` 是查询侧受控展示摘要，不代表登录标识、credential 或认证可用性。

`ContactAssetPublicValueSummary`：

```json
{
  "type": "WORK_PHONE",
  "provider": null,
  "label": "Phone",
  "displayValue": "+1 555 123 4567",
  "actionValue": "+15551234567",
  "actionUri": "tel:+15551234567",
  "includeInVCardAllowed": true
}
```

公开值约束：

- 只包含公开渲染或 vCard 组装所需最小值。
- 不包含 login method、password、OTP、MFA、OAuth token、external credential、审计详情或内部备注。
- `displayValue` 用于页面展示。
- `actionValue` 用于生成动作，例如 phone number、email address、handle 或 external reference。
- `actionUri` 是可直接用于 public action 的 URI，例如 `tel:`、`mailto:` 或 WhatsApp deep link；具体 URI 生成规则由 identity query contract 与 renderer 共同保持兼容。
- `includeInVCardAllowed` 表示该 Contact Asset 类型和值允许进入 vCard；最终是否进入 vCard 仍受 BusinessCard `includeInVCard` 与 public visibility 控制。

### 4.2 `ResolveContactActionTargets`

- 作用：为 BusinessCard Phase 1 public render / vCard 组装解析 Contact Action 的 Contact Asset 引用，返回 public-safe value summary。
- 调用方：
  - BusinessCard public render / Public Entry 内部 resolver
  - BusinessCard 管理端 readiness diagnostics
- 请求关键字段：

```json
{
  "tenantId": "tenant_001",
  "accountId": "acc_001",
  "employeeId": "emp_001",
  "targetRefs": [
    {
      "contactActionType": "CALL_PHONE",
      "targetRefType": "CONTACT_ASSET",
      "targetRefId": "ca_phone_001"
    }
  ]
}
```

输入语义：

- `tenantId` 必须来自 BusinessCard / Public Entry 已解析的受控上下文，不来自匿名访问者任意输入。
- `accountId` 是 Contact Asset Phase 1 primary owner 限定口径。
- `employeeId` 可作为当前员工分配对象或 HR lifecycle 协同校验输入；它不是 Contact Asset owner。
- `targetRefs[]` 来自 BusinessCard `contactActionConfigs`，包含 `contactActionType / targetRefType / targetRefId`。
- `SAVE_VCARD` 不引用单一 Contact Asset；调用方不应要求本接口为 `SAVE_VCARD` 解析联系方式正文。
- `OPEN_COMPANY_WEBSITE` 不属于个人 Contact Asset；调用方应通过 tenant/company public profile 边界解析。

响应关键字段：

```json
{
  "targets": [
    {
      "contactActionType": "CALL_PHONE",
      "targetRefType": "CONTACT_ASSET",
      "targetRefId": "ca_phone_001",
      "renderable": true,
      "hiddenReason": null,
      "publicValueSummary": {
        "type": "WORK_PHONE",
        "provider": null,
        "label": "Phone",
        "displayValue": "+1 555 123 4567",
        "actionValue": "+15551234567",
        "actionUri": "tel:+15551234567",
        "includeInVCardAllowed": true
      }
    }
  ]
}
```

`ResolvedContactActionTarget` 字段语义：

- `renderable = true` 仅当 Contact Asset 存在、属于请求 `tenantId + accountId` 上下文、状态为 `ACTIVE`，且 `contactActionType` 与 Contact Asset 类型兼容。
- `renderable = false` 时，`publicValueSummary` 必须为空。
- `hiddenReason` 面向内部诊断；匿名 public render 不应直接向访客暴露该 reason。
- 建议的 `hiddenReason` 归一化值包括：
  - `TARGET_REF_EMPTY`
  - `TARGET_REF_TYPE_UNSUPPORTED`
  - `CONTACT_ASSET_NOT_FOUND`
  - `CONTACT_ASSET_NOT_ACTIVE`
  - `CONTACT_ASSET_SCOPE_MISMATCH`
  - `CONTACT_ACTION_TYPE_MISMATCH`
  - `PUBLIC_VALUE_UNAVAILABLE`

动作兼容规则：

| BusinessCard action | 可解析 Contact Asset 类型 | 规则 |
| --- | --- | --- |
| `CALL_PHONE` | `WORK_PHONE` | 只返回 `ACTIVE` 工作电话 public summary。 |
| `SEND_EMAIL` | `WORK_EMAIL` | 只返回 `ACTIVE` 工作邮箱 public summary。 |
| `ADD_WECHAT` | `WECHAT`、兼容展示的 `EXTERNAL_COMMUNICATION_ACCOUNT` | 只返回可公开展示的 WeChat / 外部通信展示摘要。 |
| `OPEN_WHATSAPP` | `WHATSAPP`、兼容 phone-based WhatsApp 展示的 `WORK_PHONE` | 只返回可公开展示的 WhatsApp action summary。 |
| `SAVE_VCARD` | none | 不通过单一 Contact Asset 解析。 |
| `OPEN_COMPANY_WEBSITE` | none | 不属于个人 Contact Asset。 |

公开与安全约束：

- Contact Asset `PENDING_HANDOVER / DISABLED / RELEASED / missing` 一律解析为 `renderable = false`。
- tenant mismatch、account mismatch、target 不属于该上下文时一律解析为 `renderable = false`，不得返回正文值。
- 本接口不做 BusinessCard 展示配置判定；`enabled / visibility / displayOrder / includeInVCard` 仍由 BusinessCard owner 决定。
- 本接口不做匿名访问授权；它只在内部服务上下文中解析 public-safe contact value。
- 本接口不得返回个人登录标识、认证 credential、OTP、MFA、OAuth token、外部通信 token、内部审计字段或不可公开联系方式字段。

### 4.3 `ListAccountContactAssets`

- 作用：按账号工作上下文列出 Contact Asset 摘要，用于员工资料页、管理员资产治理页或 BusinessCard 配置候选项。
- 请求关键字段：
  - `tenant_id`
  - `account_id`
  - `employee_id`
  - `types[]`
  - `status[]`
  - `ownership[]`
- 请求语义：
  - `tenant_id + account_id` 是主要限定条件。
  - `employee_id` 可选，只用于当前分配对象过滤或校验。
  - `types / status / ownership` 均可选。
- 响应关键字段：
  - `assets[]`，元素为 `ContactAssetSummary`
- 边界：
  - 不返回 login method、credential、OTP、MFA 或外部 OAuth / channel token。
  - 不替代 BusinessCard 展示配置；调用方只能把结果作为候选引用。

### 4.4 Legacy narrow work asset queries

以下接口是历史 work email / work phone 窄口径查询。Phase 1 BusinessCard 新链路优先使用 `ResolveContactActionTargets`；管理端或兼容页面如需列出资产，应逐步迁移到统一 Contact Asset list contract。

### `ListAccountWorkEmailAssets`

- 作用：列出账户全部工作邮箱资产
- 请求关键字段：
  - `account_id`
- 响应关键字段：
  - `assets[].id`
  - `assets[].type`
  - `assets[].value`
  - `assets[].status`
  - `assets[].is_primary`
  - `assets[].assigned_at`
  - `assets[].revoked_at`

### `ListAccountWorkPhoneAssets`

- 作用：列出账户全部工作手机号资产
- 请求关键字段：
  - `account_id`
- 响应关键字段：同 `ListAccountWorkEmailAssets`

## 5. 机器身份查询

### `GetServiceAccountById`

- 作用：按 ID 查询机器账号摘要
- 请求关键字段：
  - `service_account_id`
- 响应关键字段：
  - `account.id`
  - `account.tenant_id`
  - `account.scope_level`
  - `account.type`
  - `account.name`
  - `account.status`

### `ListServiceAccounts`

- 作用：按条件列出机器账号
- 请求关键字段：
  - `tenant_id`
  - `scope_level`
  - `type`
  - `status`
- 说明：
  - 以上过滤字段均可选

### `GetApiKeyById`

- 作用：按 ID 查询 API Key 摘要
- 请求关键字段：
  - `api_key_id`
- 响应关键字段：
  - `api_key.id`
  - `api_key.service_account_id`
  - `api_key.key_code`
  - `api_key.status`
  - `api_key.expires_at`
  - `api_key.last_used_at`
- 敏感信息约束：
  - 不返回 secret 明文

### `ListApiKeysByServiceAccountId`

- 作用：列出某个机器账号下的全部 API Key 摘要
- 请求关键字段：
  - `service_account_id`
- 响应关键字段：
  - `api_keys[]`
- 敏感信息约束：
  - 不返回 secret 明文

## 6. 主要错误与返回约束

- 输入参数非法时：
  - 返回统一 validation failure
- 查询对象不存在时：
  - 多数查询接口返回空响应对象，而不是抛业务异常
- 调用方不应依赖下游内部异常结构来推断业务流程
