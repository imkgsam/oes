# identity-service Query API

> 服务设计唯一真相源：[identity-service.md](../../architecture/services/identity-service.md)。涉及 HR `Employee / Employment`、员工生命周期或正式 `人 -> org` 归属时，以 [hr-service.md](../../architecture/services/hr-service.md) 为准。本文只描述黑盒 gRPC query 接口语义，不重新定义 `identity-service` 或 HR 的长期职责、核心对象或 owner 边界。

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
- `Tenant / OrgUnit / org tree` 边界以 [tenant-org-service.md](../../architecture/services/tenant-org-service.md) 为准；本文只描述 identity query 对 tenant/org 引用的消费方式。
- 人员正式组织归属应由 `hr-service` 的 employment 语义承接，具体以 [hr-service.md](../../architecture/services/hr-service.md) 为准，不在 identity account projection 中继续维护
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

### 4.3 `ResolvePublicBusinessCardIdentity`

该 additive RPC 是 Public Entry-only 的 public-card identity/contact resolver：

- admission：exact registered `public-entry-service` workload、`aud=urn:oes:service:identity-service`、tenantless SYSTEM MACHINE principal、current certificate `cnf` 与 INTERNAL Code `identity.internal.public_business_card_identity.resolve`；Code 只可分配给 `WORKLOAD_POLICY`。
- request：`tenant_id=1`, `employee_id=2`, repeated `target_refs=3`。Tenant/employee 来自 Public Entry service-owned BusinessCard record；refs 来自该 card 的 Contact Action config。它们是 owner lookup inputs，不建立 tenant/account authority。
- owner decision：Identity 验证唯一 active EmployeeBinding、enabled TENANT account、account/binding/employee 与 selector tenant 一致；再按现有 public-safe Contact Asset rules 独立解析每个 ref。
- response：`available=1`, `tenant_id=2`, `employee_id=3`, `account_id=4`, `display_name=5`, repeated `targets=6`, safe `reason_code=7`。`targets` 复用 `ResolvedContactActionTarget` / `ContactAssetPublicValueSummary` 的既有 public-safe shape。
- failure：binding/account missing、disabled、ambiguous、tenant mismatch 或 trust/policy/dependency failure 返回 `available=false`，且不返回 display/contact value；单个 target missing/inactive/type mismatch 只返回 `renderable=false` 与 safe hidden reason，不使 required identity projection 整体失败。

Public Entry 使用本 resolver 取代 public-card 链路中的 `ResolveEmployeeLoginAccount`、`GetEmployeeBindingByAccountId`、`GetAccountById` 与 generic `ResolveContactActionTargets`。这些 BUSINESS methods 保持既有 consumers，不成为 fallback；固定 Public Entry principal 不获得 `identity.account.list` 或 `identity.account.self.read` grant。

### 4.4 `ListAccountContactAssets`

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

### 4.5 Legacy narrow work asset queries

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

### `ResolveIntegrationMachineForAuth`

- 作用：仅供 Auth 在 External API Key exchange 中确认一个 machine reference 是否仍是可用于外部集成的 Identity-owned 主体事实。
- 调用边界：调用方必须是 verified `auth-service` workload，并携带 `aud=identity-service`、`cnf` 匹配当前 mTLS certificate、`scope=identity.internal.integration_machine.resolve` 的 INTERNAL ExecutionToken；普通 Gateway、HUMAN/MACHINE role 与外部调用方均不得调用。
- 请求唯一业务字段：
  - `integration_machine_id`：由 Auth 从已验证 API Key credential 记录中取得；请求不接受 tenant、type、status、Permission Code 或 API Key。
- 响应关键字段：
  - `eligible`：只有 machine 存在、`scope_level=TENANT`、`machine_type=EXTERNAL_INTEGRATION`、`lifecycle_status=ACTIVE` 且 tenant reference 非空时为 true；
  - `integration_machine_id`、`tenant_id`、`scope_level`、`machine_type`、`lifecycle_status`；
  - opaque `lifecycle_version`、safe `decision_reference` 与 `reason_code`。
- 权威与失败规则：
  - tenant、scope、type 与 status 只来自 Identity repository；请求字段不能覆盖；
  - not found、inactive、wrong type、wrong scope、missing tenant、mTLS/Token mismatch、timeout 或 Identity unavailable 均使 Auth exchange fail closed；
  - Identity 返回的 tenant 必须与 Auth credential-owned tenant reference 相等，否则 Auth 以 tenant mismatch 拒绝；
  - 任何外部 HTTP 响应不得区分上述内部原因。
- 稳定 `reason_code`：`INTEGRATION_MACHINE_ACTIVE`、`INTEGRATION_MACHINE_NOT_FOUND`、`INTEGRATION_MACHINE_INACTIVE`、`INTEGRATION_MACHINE_WRONG_TYPE`、`INTEGRATION_MACHINE_WRONG_SCOPE`、`INTEGRATION_MACHINE_TENANT_MISSING`；只有第一项允许 `eligible=true`，其余均由 Auth 对外映射为不可枚举失败。
- 运行时接入：现有 `IdentityQueryService` proto、`identity-query.grpc.controller.ts`、`application/queries/service-account/resolve-integration-machine-for-auth.*` 与既有 ServiceAccount repository 是唯一实现边界；不得复用 legacy `AuthenticateApiKey` 或管理查询的 operator-scope 语义替代。

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

## 6. Auth login account resolution

本组三个 additive RPC 只服务 `auth-service` 的登录/会话安全流程，共享 INTERNAL Code `identity.internal.auth_login_account.resolve`。调用必须同时匹配 exact Auth workload、`aud=urn:oes:service:identity-service`、SYSTEM MACHINE principal、current certificate `cnf` 和目标方 method declaration。该 Code 只进入 `WORKLOAD_POLICY`，不进入 HUMAN/MACHINE role 或 external token。

### `ListAuthLoginAccountCandidates`

- request：`user_id`，由 Auth 已验证的本地 login method / OTP 结果取得。
- response：只返回当前 available 且结构有效的 `account_id`、`tenant_id`、`scope_level`、`display_name`。SYSTEM account 要求 tenant 为空，TENANT account 要求 tenant 非空。
- 空结果只表示 Auth 无可用 account candidate，不授予 user/account authority。

### `ResolveAuthLoginAccount`

- request：`user_id`, `account_id`。
- Identity 必须从 owner storage 验证 account 存在且属于该 user；owner mismatch 返回空/safe denial，不向 Auth 泄露其他 owner。
- response：`user_id`、`account_id`、`tenant_id`、`scope_level`、`display_name`、`account_enabled`。disabled account 可返回 `account_enabled=false` 以保持 Auth 的稳定错误/审计，但它不允许 session 建立。

### `ResolveAuthEmployeeLoginAccount`

- request：`tenant_id`, `employee_id`，分别来自已验证 terminal/device boundary 与 HR owner resolver。
- Identity 必须校验 active EmployeeBinding、account scope=`TENANT`、account tenant 与 request tenant 一致。
- response 与 `ResolveAuthLoginAccount` 的 minimal account projection 一致；另回显 `employee_id`。

三个 request selector 都是 lookup input，不是 execution tenant/operator authority。Identity 不返回 profile、contact asset、login method、credential、role/grant 或通用账号目录字段。generic `GetAccountsByUserId`、`GetAccountById`、`ResolveEmployeeLoginAccount`、`GetUserByEmail`、`GetUserByPhone` 保持现有 BUSINESS contract，Auth 登录路由不再使用它们。

## 7. 主要错误与返回约束

- 输入参数非法时：
  - 返回统一 validation failure
- 查询对象不存在时：
  - 多数查询接口返回空响应对象，而不是抛业务异常
- 调用方不应依赖下游内部异常结构来推断业务流程
