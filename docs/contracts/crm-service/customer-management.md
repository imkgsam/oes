# crm-service Customer Management API

> `crm-service` 的服务职责、核心对象、owner 边界与长期命名以 [crm-service.md](/Users/acehood/Documents/GitHub/oes/docs/architecture/services/crm-service.md) 为唯一稳定真相源。本文只描述 phase 1 management command 黑盒契约。

## 1. 模块职责

`CustomerManagementService` 负责 phase 1 最小客户主档的写接口。

## 2. 通用上下文要求

所有 phase 1 management command 统一要求：

- `tenant_id`
- operator context
- trace context
- audit context

补充约束：

- 本文件只冻结“必须要求这些上下文存在”，不展开它们的完整内部字段结构
- 所有 command 都必须按 command 语义处理，不得被调用方当作 query 或幂等读取接口使用
- phase 1 不冻结 command metadata header、审计落库结构、重试策略或幂等键设计

## 3. 写入基线语义

### 3.1 CustomerAccount 与 Party 边界

- `CreateCustomerAccount` 创建的是 CRM 客户关系外壳，不创建 Party truth
- `BindCustomerAccountToTenantParty` 只建立受控主绑定，不把 `tenantPartyId` owner 从 `party-service` 转移到 `crm-service`
- `sales-service`、future pricing、future agreement 后续采用的稳定主体引用仍是 active primary `tenantPartyId`

### 3.2 Primary Binding 语义

- phase 1 一条 `CustomerAccount` 只有一个 active primary `tenantPartyId`
- 同一 `tenantId + tenantPartyId` 最多对应一个 active `CustomerAccount`
- `BindCustomerAccountToTenantParty` 成功前必须校验目标 `tenantPartyId` 存在且当前可绑定
- phase 1 不冻结一客多主体、binding history 治理或复杂 rebinding workflow

### 3.3 Selector Eligibility 语义

- 只有 `ACTIVE_CUSTOMER + active primary binding` 才可被 `SearchSelectableCustomers` 返回
- `BLOCKED / ARCHIVED` 账户即使保留主绑定，也不得进入 selectable customer 结果
- 没有 active primary binding 的账户不得进入 selectable customer 结果

### 3.4 Contact / Address 边界

- `CustomerContact / CustomerAddress` 是 CRM 业务关系信息
- 它们不代表 Party 注册信息真相
- phase 1 不冻结 bill-to / ship-to / legal entity 复杂地址模型

### 3.5 Status 语义

- phase 1 只显式冻结 `ACTIVE_CUSTOMER`、`BLOCKED`、`ARCHIVED` 对 selector eligibility 的影响
- 完整状态机 deferred，不在本文件中展开更多状态迁移规则

## 4. RPC 语义

### `CreateCustomerAccount`

- 作用：创建一个新的 `CustomerAccount` 关系外壳

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `display_name` | 是 | CRM 客户关系显示名 |
| `customer_category` | 否 | optional 分类摘要 |
| `tags[]` | 否 | 初始业务标签 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_account` | 新建后的 `CustomerAccount` |

空语义：

- 成功时必须返回新建 `customer_account`

关键语义：

- 新建账户默认状态为 `ACTIVE_CUSTOMER`
- 新建成功不等于已拥有 active primary binding
- 新建成功不创建 `party-service` 主体事实或租户主体引用

### `UpdateCustomerAccountBasics`

- 作用：更新某个 `CustomerAccount` 的基本资料

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `customer_account_id` | 是 | 目标 CustomerAccount 标识 |
| `display_name` | 否 | 更新后的 CRM 客户关系显示名 |
| `customer_category` | 否 | 更新后的分类摘要 |
| `tags[]` | 否 | 更新后的业务标签全集 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_account` | 更新后的 `CustomerAccount` |

空语义：

- 成功时必须返回更新后的 `customer_account`

说明：

- 该命令不修改 `primary_binding`
- 该命令不承担状态迁移；状态变更统一走 `ChangeCustomerStatus`

### `BindCustomerAccountToTenantParty`

- 作用：为某个 `CustomerAccount` 建立 active primary `tenantPartyId` 绑定

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `customer_account_id` | 是 | 目标 CustomerAccount 标识 |
| `tenant_party_id` | 是 | 目标 `TenantParty` 稳定引用 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_account` | 建立绑定后的 `CustomerAccount` |

关键语义：

- 成功前必须校验目标 `tenant_party_id` 在当前租户存在
- 成功前必须校验目标 `tenant_party_id` 当前可绑定
- phase 1 成功后，目标账户存在且仅存在一个 active primary `tenantPartyId`
- phase 1 若同一 `tenant_id + tenant_party_id` 已被另一个 active `CustomerAccount` 占用，则不得重复成功
- phase 1 不展开多主绑定或复杂 rebinding workflow

空语义：

- 成功时必须返回带 active primary binding 的 `customer_account`
- 若目标 `CustomerAccount` 不存在，返回 `NOT_FOUND`
- 若目标 `tenant_party_id` 不存在，返回 `NOT_FOUND`
- 若同一 `tenant_id + tenant_party_id` 已绑定到其他 active `CustomerAccount`，返回 `ALREADY_EXISTS`
- 若目标 `tenant_party_id` 存在但当前不可绑定，返回 `FAILED_PRECONDITION`
- 若目标账户已经存在不同的 active primary binding，返回 `FAILED_PRECONDITION`

### `UpsertCustomerContact`

- 作用：为某个 `CustomerAccount` 新增或更新 CRM 联系人

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `customer_account_id` | 是 | 所属 CustomerAccount 标识 |
| `customer_contact_id` | 否 | 更新时填写；新增时为空 |
| `display_name` | 是 | CRM 联系人显示名 |
| `role_title` | 否 | optional 业务角色 / 职务摘要 |
| `email` | 否 | optional 联系邮箱 |
| `phone` | 否 | optional 联系电话 |
| `is_primary_contact` | 否 | 是否标记为主要业务联系人 |
| `is_active` | 否 | 当前是否启用；未传时由服务采用默认值 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `contact` | 新建或更新后的 `CustomerContact` |

空语义：

- 成功时必须返回最新 `contact`
- 若目标 `CustomerAccount` 不存在，返回 `NOT_FOUND`
- 若传入了 `customer_contact_id` 但目标联系人不存在，返回 `NOT_FOUND`

### `UpsertCustomerAddress`

- 作用：为某个 `CustomerAccount` 新增或更新 CRM 地址

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `customer_account_id` | 是 | 所属 CustomerAccount 标识 |
| `customer_address_id` | 否 | 更新时填写；新增时为空 |
| `label` | 是 | 地址标签摘要 |
| `country_code` | 是 | 国家 / 地区代码 |
| `region` | 否 | optional 省州区域摘要 |
| `locality` | 否 | optional 城市或区县摘要 |
| `address_line_1` | 是 | 地址主行 |
| `address_line_2` | 否 | optional 地址补充行 |
| `postal_code` | 否 | optional 邮编 |
| `is_primary_address` | 否 | 是否标记为主要业务地址 |
| `is_active` | 否 | 当前是否启用；未传时由服务采用默认值 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `address` | 新建或更新后的 `CustomerAddress` |

空语义：

- 成功时必须返回最新 `address`
- 若目标 `CustomerAccount` 不存在，返回 `NOT_FOUND`
- 若传入了 `customer_address_id` 但目标地址不存在，返回 `NOT_FOUND`

### `ChangeCustomerStatus`

- 作用：修改某个 `CustomerAccount` 的客户状态

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `customer_account_id` | 是 | 目标 CustomerAccount 标识 |
| `target_status` | 是 | 目标状态；phase 1 只显式冻结 `ACTIVE_CUSTOMER / BLOCKED / ARCHIVED` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_account` | 状态变更后的 `CustomerAccount` |

关键语义：

- 该命令只修改客户状态，不修改 `primary_binding`
- 变更为 `BLOCKED` 或 `ARCHIVED` 后，账户必须立即失去 selectable customer 资格
- 变更为 `ACTIVE_CUSTOMER` 后，只有在同时存在 active primary binding 时才可重新进入 selectable customer 结果

空语义：

- 成功时必须返回状态变更后的 `customer_account`
- 若目标 `CustomerAccount` 不存在，返回 `NOT_FOUND`

## 5. 错误语义

phase 1 management 只冻结以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法，或 `target_status` 非法 |
| `UNAUTHENTICATED` | 缺少有效 operator context、trace context 或 audit context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有在该 tenant / customer account 上执行命令的权限 |
| `NOT_FOUND` | 目标 `CustomerAccount / CustomerContact / CustomerAddress` 不存在，或引用的 `tenant_party_id` 不存在 |
| `ALREADY_EXISTS` | 资源或一对一绑定关系已存在，例如同一 `tenant_id + tenant_party_id` 已绑定到其他 active `CustomerAccount` |
| `FAILED_PRECONDITION` | 资源存在，但当前状态不满足命令前提，例如 `tenant_party_id` 当前不可绑定，或目标账户已存在不同的 active primary binding |

补充说明：

- phase 1 不冻结除上述列表之外的其他错误码
- 命令成功时不得通过空响应掩盖实际结果，必须返回对应资源或结果摘要
