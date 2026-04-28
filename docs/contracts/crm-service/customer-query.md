# crm-service Customer Query API

## 1. 模块职责

`CustomerQueryService` 负责 phase 1 最小客户主档的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`CustomerQueryService`
- 所有 RPC 显式带 `tenant_id`
- 所有 RPC 都要求：
  - operator context
  - trace context

phase 1 query 只覆盖：

- Sales / Pricing / Agreement 入口使用的 selectable customer 查询
- `CustomerAccount` 单对象读取
- `CustomerAccount` 目录搜索
- `CustomerContact` 列表读取
- `CustomerAddress` 列表读取

phase 1 query 不覆盖：

- `Opportunity / Activity / Customer 360`
- `AR / credit / payment`
- 一客多主体、多 legal entity、多 bill-to / ship-to 复杂读模型
- `CustomerItemMapping` 完整目录
- integration events 派生读模型

## 2. 通用读取对象

### 2.1 `CustomerAccount`

phase 1 `CustomerAccount` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_account_id` | CustomerAccount 稳定标识 |
| `customer_account_no` | CustomerAccount 编号摘要 |
| `tenant_id` | 显式租户边界 |
| `display_name` | CRM 客户关系显示名 |
| `status` | 客户状态摘要 |
| `customer_category` | optional 分类摘要 |
| `tags[]` | 业务标签摘要 |
| `primary_binding` | 当前 active primary binding 摘要；未绑定时为空 |

说明：

- `CustomerAccount` 读取的是 CRM 客户关系外壳，不是 Party truth
- `primary_binding.tenant_party_id` 是供 Sales / Pricing / Agreement 采用的稳定主体引用

### 2.2 `CustomerPartyBindingSummary`

phase 1 `CustomerPartyBindingSummary` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `tenant_party_id` | 当前 active primary `tenantPartyId` |
| `binding_status` | 绑定状态摘要；phase 1 成功可选客户只暴露 active primary binding |
| `party_display_name` | optional Party 摘要显示名，用于选择器展示 |

说明：

- phase 1 一条 `CustomerAccount` 最多只有一个 active primary binding
- 同一 `tenantId + tenantPartyId` 最多只能出现在一个 active `CustomerAccount.primary_binding`

### 2.3 `SelectableCustomer`

phase 1 `SelectableCustomer` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_account_id` | 可选 CustomerAccount 标识 |
| `customer_account_no` | CustomerAccount 编号摘要 |
| `display_name` | CRM 客户关系显示名 |
| `status` | 固定为 `ACTIVE_CUSTOMER` |
| `primary_tenant_party_id` | 可进入交易链的稳定主体引用 |
| `primary_party_display_name` | optional Party 摘要显示名 |

说明：

- `SearchSelectableCustomers` 只返回 `ACTIVE_CUSTOMER + active primary binding`
- `BLOCKED` 与 `ARCHIVED` 客户即使存在主绑定，也不得出现在该结果中
- 没有 active primary binding 的 `CustomerAccount` 也不得出现在该结果中

### 2.4 `CustomerContact`

phase 1 `CustomerContact` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_contact_id` | 联系人标识 |
| `customer_account_id` | 所属 CustomerAccount 标识 |
| `display_name` | CRM 联系人显示名 |
| `role_title` | optional 业务角色 / 职务摘要 |
| `email` | optional 联系邮箱 |
| `phone` | optional 联系电话 |
| `is_primary_contact` | 是否为主要业务联系人 |
| `is_active` | 当前是否启用 |

说明：

- `CustomerContact` 是 CRM 业务关系信息，不是 Party 注册信息真相

### 2.5 `CustomerAddress`

phase 1 `CustomerAddress` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_address_id` | 地址标识 |
| `customer_account_id` | 所属 CustomerAccount 标识 |
| `label` | 地址标签摘要 |
| `country_code` | 国家 / 地区代码 |
| `region` | optional 省州区域摘要 |
| `locality` | optional 城市或区县摘要 |
| `address_line_1` | 地址主行 |
| `address_line_2` | optional 地址补充行 |
| `postal_code` | optional 邮编 |
| `is_primary_address` | 是否为主要业务地址 |
| `is_active` | 当前是否启用 |

说明：

- `CustomerAddress` 是 CRM 业务关系信息，不是 Party 注册地址真相
- phase 1 不展开 bill-to / ship-to / legal entity 地址矩阵

## 3. RPC 语义

### `SearchSelectableCustomers`

- 作用：按条件分页搜索可进入 Sales / Pricing / Agreement 入口的客户选择结果

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `keyword` | 否 | 按 `customer_account_no`、`display_name` 或主绑定显示摘要检索 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customers[]` | 当前页 `SelectableCustomer` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

关键语义：

- 只返回 `ACTIVE_CUSTOMER + active primary binding`
- `BLOCKED / ARCHIVED` 不得出现在结果中
- 没有 active primary binding 的账户不得出现在结果中

### `GetCustomerAccount`

- 作用：按 `customer_account_id` 读取单个 `CustomerAccount`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `customer_account_id` | 是 | 目标 CustomerAccount 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_account` | 单个 `CustomerAccount` 读取模型 |

空语义：

- 目标 `CustomerAccount` 存在时返回 `customer_account`
- 目标 `CustomerAccount` 不存在时返回 `NOT_FOUND`

### `SearchCustomerAccounts`

- 作用：按条件分页搜索 CRM 客户账户目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `keyword` | 否 | 按 `customer_account_no` 或 `display_name` 检索 |
| `status` | 否 | 按客户状态过滤 |
| `primary_tenant_party_id` | 否 | 按 active primary `tenantPartyId` 过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_accounts[]` | 当前页 `CustomerAccount` 摘要列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

说明：

- 该 RPC 是 CRM 全量账户目录入口，不等于 selectable customer 入口
- `BLOCKED / ARCHIVED` 与未绑定账户可以出现在该结果中

### `ListCustomerContacts`

- 作用：列出某个 `CustomerAccount` 的联系人列表

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `customer_account_id` | 是 | 目标 CustomerAccount 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `contacts[]` | `CustomerContact` 列表 |

空语义：

- 目标 `CustomerAccount` 不存在时返回 `NOT_FOUND`
- 目标 `CustomerAccount` 存在但暂无联系人时，返回空 `contacts[]`

### `ListCustomerAddresses`

- 作用：列出某个 `CustomerAccount` 的地址列表

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `customer_account_id` | 是 | 目标 CustomerAccount 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `addresses[]` | `CustomerAddress` 列表 |

空语义：

- 目标 `CustomerAccount` 不存在时返回 `NOT_FOUND`
- 目标 `CustomerAccount` 存在但暂无地址时，返回空 `addresses[]`

## 4. 错误语义

phase 1 query 只冻结以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法或分页参数非法 |
| `UNAUTHENTICATED` | 缺少有效 operator context 或 trace context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / customer account 的权限 |
| `NOT_FOUND` | 单对象读取目标不存在，或 `ListCustomerContacts / ListCustomerAddresses` 的 `customer_account_id` 不存在 |
| `ALREADY_EXISTS` | query RPC 不应使用该错误码；phase 1 保留但不在 query 侧展开业务语义 |
| `FAILED_PRECONDITION` | 资源存在，但当前前提不满足读取要求 |

补充说明：

- `SearchSelectableCustomers` 空页、`SearchCustomerAccounts` 空页、联系人空列表、地址空列表都必须走正常响应语义
- phase 1 不冻结除上述列表之外的其他错误码
