# srm-service Supplier Management API

## 1. 模块职责

`SupplierManagementService` 负责 phase 1 最小供应商主档的写接口。

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

### 3.1 SupplierProfile 与 Party 边界

- `CreateSupplierProfile` 创建的是 SRM 供应商关系外壳，不创建 Party truth
- `BindSupplierToTenantParty` 只建立正式主体绑定，不把 `tenantPartyId` owner 从 `party-service` 转移到 `srm-service`
- future `procurement-service` 与其他下游后续采用的正式主体引用仍是 `tenantPartyId`

### 3.2 正式主体绑定语义

- phase 1 一条 `SupplierProfile` 最多只有一个正式 `tenantPartyId`
- 同一 `tenantId + tenantPartyId` 只允许一个正式 `SupplierProfile`
- `BindSupplierToTenantParty` 成功前必须校验目标 `tenantPartyId` 存在
- `ChangeSupplierStatus` 在把 `SupplierProfile` 变更为 `ACTIVE` 前，必须校验当前已绑定 active `tenantPartyId`
- phase 1 不冻结复杂 rebinding、binding history 治理或 merge workflow

### 3.3 Contact / Address 边界

- `SupplierContact / SupplierAddress` 是 SRM 业务协作信息
- 它们不代表 Party 注册信息真相
- phase 1 不冻结 legal entity 地址矩阵、资质地址或 bill-to / remit-to 复杂模型

### 3.4 Offering 边界

- `SupplierOffering` 表达 `supplierId + itemId` 的可供应关系事实
- `UpsertSupplierOffering` 不创建或修改 `SupplierItemMapping`
- `ACTIVE SupplierOffering` 只能挂 `ACTIVE SupplierProfile`
- `ACTIVE SupplierOffering` 只能指向 `purchasable Item`
- `SupplierOffering` 不承载价格、MOQ、账期、lead time 或供应表现
- phase 1 对同一 `tenant_id + supplier_id + item_id` 只收敛到一个当前 offering 事实，不创建并行重复事实

### 3.5 Status 语义

- phase 1 只显式冻结 `ACTIVE / INACTIVE` 的最小行为语义
- 更复杂的 `SupplierStatus` 状态机 deferred，不在本文件中展开
- 非 `ACTIVE` 的 `SupplierProfile` 不得承载 active offering

## 4. RPC 语义

### `CreateSupplierProfile`

- 作用：创建一个新的 `SupplierProfile` 关系外壳

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `display_name` | 是 | SRM 供应商关系显示名 |
| `supplier_no` | 否 | optional 供应商编号摘要 |
| `supplier_category` | 否 | optional 分类摘要 |
| `tags[]` | 否 | 初始业务标签 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier` | 新建后的 `SupplierProfile` |

空语义：

- 成功时必须返回新建 `supplier`

关键语义：

- 新建 `SupplierProfile` 不等于已绑定正式主体
- 新建成功不创建 `party-service` 主体事实或租户主体引用
- 新建成功默认不是已可生效的 `ACTIVE SupplierProfile`

### `UpdateSupplierProfileBasics`

- 作用：更新某个 `SupplierProfile` 的基本资料

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `supplier_id` | 是 | 目标 SupplierProfile 标识 |
| `display_name` | 否 | 更新后的 SRM 供应商关系显示名 |
| `supplier_no` | 否 | 更新后的供应商编号摘要 |
| `supplier_category` | 否 | 更新后的分类摘要 |
| `tags[]` | 否 | 更新后的业务标签全集 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier` | 更新后的 `SupplierProfile` |

空语义：

- 成功时必须返回更新后的 `supplier`

说明：

- 该命令不修改 `party_binding`
- 该命令不承担状态迁移；状态变更统一走 `ChangeSupplierStatus`

### `BindSupplierToTenantParty`

- 作用：为某个 `SupplierProfile` 建立正式 `tenantPartyId` 绑定

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `supplier_id` | 是 | 目标 SupplierProfile 标识 |
| `tenant_party_id` | 是 | 目标 `TenantParty` 稳定引用 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier` | 建立绑定后的 `SupplierProfile` |

关键语义：

- 成功前必须校验目标 `tenant_party_id` 在当前租户存在
- phase 1 同一 `tenant_id + tenant_party_id` 只允许一个正式 `SupplierProfile`
- 若目标 `SupplierProfile` 当前已是 `ACTIVE`，则绑定成功前还必须校验目标 `tenant_party_id` 处于 active 状态
- phase 1 不展开多主体绑定或复杂 rebinding workflow

空语义：

- 成功时必须返回带正式主体绑定的 `supplier`
- 若目标 `SupplierProfile` 不存在，返回 `NOT_FOUND`
- 若目标 `tenant_party_id` 不存在，返回 `NOT_FOUND`
- 若同一 `tenant_id + tenant_party_id` 已被其他 `SupplierProfile` 占用，返回 `ALREADY_EXISTS`
- 若目标 `SupplierProfile` 已存在不同的正式 `tenantPartyId`，返回 `FAILED_PRECONDITION`
- 若目标 `SupplierProfile` 当前为 `ACTIVE` 且目标 `tenant_party_id` 非 active，返回 `FAILED_PRECONDITION`

### `UpsertSupplierContact`

- 作用：为某个 `SupplierProfile` 新增或更新 SRM 联系人

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `supplier_id` | 是 | 所属 SupplierProfile 标识 |
| `supplier_contact_id` | 否 | 更新时填写；新增时为空 |
| `display_name` | 是 | SRM 联系人显示名 |
| `role_title` | 否 | optional 业务角色 / 职务摘要 |
| `email` | 否 | optional 联系邮箱 |
| `phone` | 否 | optional 联系电话 |
| `is_primary_contact` | 否 | 是否标记为主要业务联系人 |
| `is_active` | 否 | 当前是否启用；未传时由服务采用默认值 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `contact` | 新建或更新后的 `SupplierContact` |

空语义：

- 成功时必须返回最新 `contact`
- 若目标 `SupplierProfile` 不存在，返回 `NOT_FOUND`
- 若传入了 `supplier_contact_id` 但目标联系人不存在，返回 `NOT_FOUND`

### `UpsertSupplierAddress`

- 作用：为某个 `SupplierProfile` 新增或更新 SRM 地址

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `supplier_id` | 是 | 所属 SupplierProfile 标识 |
| `supplier_address_id` | 否 | 更新时填写；新增时为空 |
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
| `address` | 新建或更新后的 `SupplierAddress` |

空语义：

- 成功时必须返回最新 `address`
- 若目标 `SupplierProfile` 不存在，返回 `NOT_FOUND`
- 若传入了 `supplier_address_id` 但目标地址不存在，返回 `NOT_FOUND`

### `UpsertSupplierOffering`

- 作用：新增或更新某个 `supplierId + itemId` 的 `SupplierOffering`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `supplier_offering_id` | 否 | 更新时可填写；新增时为空 |
| `supplier_id` | 是 | 所属 SupplierProfile 标识 |
| `item_id` | 是 | 目标 Item 标识 |
| `target_status` | 是 | 目标状态；phase 1 只显式冻结 `ACTIVE / INACTIVE` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `offering` | 新建或更新后的 `SupplierOffering` |

关键语义：

- `SupplierOffering` 只维护可供应关系事实，不维护采购商业条款
- 成功前必须校验目标 `SupplierProfile` 存在
- 成功前必须校验目标 `Item` 存在
- 若 `target_status = ACTIVE`，则目标 `SupplierProfile` 必须处于 `ACTIVE`
- 若 `target_status = ACTIVE`，则目标 `Item` 必须具备 `purchasable` 能力
- 若同一 `tenant_id + supplier_id + item_id` 已存在 current offering，重复 upsert 必须收敛到该事实，而不是创建并行重复 offering
- 若传入 `supplier_offering_id`，不得借该命令把既有 offering 改挂到不同 `supplier_id` 或 `item_id`

空语义：

- 成功时必须返回最新 `offering`
- 若目标 `SupplierProfile` 不存在，返回 `NOT_FOUND`
- 若目标 `Item` 不存在，返回 `NOT_FOUND`
- 若传入了 `supplier_offering_id` 但目标 offering 不存在，返回 `NOT_FOUND`
- 若目标 `SupplierProfile` 存在但当前不是 `ACTIVE` 且请求 `target_status = ACTIVE`，返回 `FAILED_PRECONDITION`
- 若目标 `Item` 存在但当前不具备 `purchasable` 能力且请求 `target_status = ACTIVE`，返回 `FAILED_PRECONDITION`
- 若传入 `supplier_offering_id` 试图改挂到不同 `supplier_id` 或 `item_id`，返回 `FAILED_PRECONDITION`

### `ChangeSupplierStatus`

- 作用：修改某个 `SupplierProfile` 的供应商状态

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `supplier_id` | 是 | 目标 SupplierProfile 标识 |
| `target_status` | 是 | 目标状态；phase 1 只显式冻结 `ACTIVE / INACTIVE` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier` | 状态变更后的 `SupplierProfile` |

关键语义：

- 该命令只修改 `SupplierProfile` 状态，不修改 `party_binding`
- 变更为 `ACTIVE` 前，目标 `SupplierProfile` 必须已绑定 active `tenantPartyId`
- 变更为非 `ACTIVE` 前，目标 `SupplierProfile` 不得仍挂有 active offering；调用方必须先通过 `UpsertSupplierOffering` 使其失活

空语义：

- 成功时必须返回状态变更后的 `supplier`
- 若目标 `SupplierProfile` 不存在，返回 `NOT_FOUND`
- 若目标 `SupplierProfile` 缺少正式主体绑定且请求 `target_status = ACTIVE`，返回 `FAILED_PRECONDITION`
- 若目标 `SupplierProfile` 已绑定的 `tenantPartyId` 当前非 active 且请求 `target_status = ACTIVE`，返回 `FAILED_PRECONDITION`
- 若目标 `SupplierProfile` 仍存在 active offering 且请求变更为非 `ACTIVE`，返回 `FAILED_PRECONDITION`

## 5. 错误语义

phase 1 management 只冻结以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法，或 `target_status` 非法 |
| `UNAUTHENTICATED` | 缺少有效 operator context、trace context 或 audit context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有在该 tenant / supplier / offering 上执行命令的权限 |
| `NOT_FOUND` | 目标 `SupplierProfile / SupplierContact / SupplierAddress / SupplierOffering` 不存在，或引用的 `tenant_party_id / item_id` 不存在 |
| `ALREADY_EXISTS` | 资源或一对一绑定关系已存在，例如同一 `tenant_id + tenant_party_id` 已被其他 `SupplierProfile` 占用 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态或 owner 规则不满足命令前提，例如尝试激活未绑定主体的供应商、尝试激活指向 non-purchasable Item 的 offering，或尝试在仍有 active offering 时停用供应商 |

补充说明：

- phase 1 不冻结除上述列表之外的其他错误码
- 命令成功时不得通过空响应掩盖实际结果，必须返回对应资源或结果摘要
