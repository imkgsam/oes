# srm-service Supplier Query API

## 1. 模块职责

`SupplierQueryService` 负责 phase 1 最小供应商主档的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`SupplierQueryService`
- 分类：`BUSINESS / HUMAN / WEB`
- audience：`urn:oes:service:srm-service`
- tenant/operator/org/trace/audit 只来自 verified ET/transport context；request 不携带 authority context

Exact Permission mapping：

| RPC | Code |
| --- | --- |
| `GetSupplier` | `srm.supplier_profile.get_by_id` |
| `SearchSuppliers` | `srm.supplier_profile.list` |
| `ListSupplierContacts` | `srm.supplier_profile.get_by_id` |
| `ListSupplierAddresses` | `srm.supplier_profile.get_by_id` |
| `ListSupplierOfferingsBySupplier` | `srm.supplier_offering.list_by_supplier` |
| `ListSupplierOfferingsByItem` | `srm.supplier_offering.list_by_item` |

Gateway supplier detail 同时聚合 Supplier、contact、address 与 offering，因此 HTTP detail route 必须同时具备 `srm.supplier_profile.get_by_id` 与 `srm.supplier_offering.list_by_supplier`，不能用一个 Code 隐式放宽另一个 RPC。

phase 1 query 只覆盖：

- `SupplierProfile` 单对象读取
- `SupplierProfile` 目录搜索
- `SupplierContact` 列表读取
- `SupplierAddress` 列表读取
- 按供应商读取 `SupplierOffering`
- 按 Item 读取 `SupplierOffering`

phase 1 query 不覆盖：

- RFQ
- `SupplierQuote`
- 采购价格历史
- MOQ / 账期 / lead time
- 供应商绩效 / 质量整改
- `SupplierItemMapping` 解析或维护
- integration events 派生读模型

## 2. 通用读取对象

### 2.1 `SupplierProfile`

phase 1 `SupplierProfile` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_id` | SupplierProfile 稳定标识 |
| `supplier_no` | optional 供应商编号摘要 |
| `tenant_id` | 显式租户边界 |
| `display_name` | SRM 供应商关系显示名 |
| `status` | 供应商状态摘要 |
| `supplier_category` | optional 分类摘要 |
| `tags[]` | 业务标签摘要 |
| `party_binding` | 当前正式主体绑定摘要；未绑定时为空 |

说明：

- `SupplierProfile` 读取的是 SRM 供应商关系外壳，不是 Party truth
- `party_binding.tenant_party_id` 是正式主体稳定引用
- 同一 `tenantId + tenantPartyId` 只允许一个正式 `SupplierProfile`
- `ACTIVE SupplierProfile` 必须返回 active `tenantPartyId` 绑定

### 2.2 `SupplierPartyBindingSummary`

phase 1 `SupplierPartyBindingSummary` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `tenant_party_id` | 当前正式 `tenantPartyId` |
| `binding_status` | 绑定状态摘要 |
| `party_display_name` | optional Party 摘要显示名，用于主档展示 |

说明：

- phase 1 一条 `SupplierProfile` 最多只有一个正式主体绑定
- phase 1 不在 query 侧展开 binding history 或复杂 rebinding 读模型

### 2.3 `SupplierContact`

phase 1 `SupplierContact` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_contact_id` | 联系人标识 |
| `supplier_id` | 所属 SupplierProfile 标识 |
| `display_name` | SRM 联系人显示名 |
| `role_title` | optional 业务角色 / 职务摘要 |
| `email` | optional 联系邮箱 |
| `phone` | optional 联系电话 |
| `is_primary_contact` | 是否为主要业务联系人 |
| `is_active` | 当前是否启用 |

说明：

- `SupplierContact` 是 SRM 业务协作信息，不是 Party 注册信息真相

### 2.4 `SupplierAddress`

phase 1 `SupplierAddress` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_address_id` | 地址标识 |
| `supplier_id` | 所属 SupplierProfile 标识 |
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

- `SupplierAddress` 是 SRM 业务协作信息，不是 Party 注册地址真相

### 2.5 `SupplierOffering`

phase 1 `SupplierOffering` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_offering_id` | offering 标识 |
| `supplier_id` | 所属 SupplierProfile 标识 |
| `item_id` | 被供应 Item 标识 |
| `item_code` | Item 编码摘要 |
| `item_name` | Item 名称摘要 |
| `status` | offering 状态摘要 |

说明：

- `SupplierOffering` 只表达 `supplierId + itemId` 的可供应关系事实
- `SupplierOffering` 不承载价格、MOQ、账期、lead time 或供应表现
- `SupplierItemMapping` 继续归 `item-master-service`，不在本读取模型中展开

## 3. RPC 语义

### `GetSupplier`

- 作用：按 `supplier_id` 读取单个 `SupplierProfile`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `supplier_id` | 是 | 目标 SupplierProfile 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier` | 单个 `SupplierProfile` 读取模型 |

空语义：

- 目标 `SupplierProfile` 存在时返回 `supplier`
- 目标 `SupplierProfile` 不存在时返回 `NOT_FOUND`

### `SearchSuppliers`

- 作用：按条件分页搜索 SRM 供应商主档目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `keyword` | 否 | 按 `supplier_no / display_name` 检索 |
| `status` | 否 | 按供应商状态过滤 |
| `tenant_party_id` | 否 | 按正式主体 `tenantPartyId` 过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `suppliers[]` | 当前页 `SupplierProfile` 摘要列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

### `ListSupplierContacts`

- 作用：列出某个 `SupplierProfile` 的联系人列表

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `supplier_id` | 是 | 目标 SupplierProfile 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `contacts[]` | `SupplierContact` 列表 |

空语义：

- 目标 `SupplierProfile` 不存在时返回 `NOT_FOUND`
- 目标 `SupplierProfile` 存在但暂无联系人时，返回空 `contacts[]`

### `ListSupplierAddresses`

- 作用：列出某个 `SupplierProfile` 的地址列表

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `supplier_id` | 是 | 目标 SupplierProfile 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `addresses[]` | `SupplierAddress` 列表 |

空语义：

- 目标 `SupplierProfile` 不存在时返回 `NOT_FOUND`
- 目标 `SupplierProfile` 存在但暂无地址时，返回空 `addresses[]`

### `ListSupplierOfferingsBySupplier`

- 作用：按供应商分页读取当前 `SupplierOffering` 列表

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `supplier_id` | 是 | 目标 SupplierProfile 标识 |
| `status` | 否 | 按 offering 状态过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `offerings[]` | 当前页 `SupplierOffering` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 目标 `SupplierProfile` 不存在时返回 `NOT_FOUND`
- 目标 `SupplierProfile` 存在但暂无 offering 时，返回空页

### `ListSupplierOfferingsByItem`

- 作用：按 Item 分页读取当前 `SupplierOffering` 列表

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `item_id` | 是 | 目标 Item 标识 |
| `status` | 否 | 按 offering 状态过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `offerings[]` | 当前页 `SupplierOffering` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 目标 `Item` 不存在时返回 `NOT_FOUND`
- 目标 `Item` 存在但暂无 offering 时，返回空页

说明：

- 该 RPC 只解决“当前有哪些供应商声明可供应这个 Item”的只读需求
- 若调用方只需要可进入正式采购链的关系，应按 `status = ACTIVE` 调用

## 4. 错误语义

phase 1 query 只冻结以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法或分页参数非法 |
| `UNAUTHENTICATED` | 缺少有效 operator context 或 trace context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / supplier / item 的权限 |
| `NOT_FOUND` | 单对象读取目标不存在，或 `ListSupplierContacts / ListSupplierAddresses / ListSupplierOfferingsBySupplier / ListSupplierOfferingsByItem` 的目标资源不存在 |
| `ALREADY_EXISTS` | query RPC 不应使用该错误码；phase 1 保留但不在 query 侧展开业务语义 |
| `FAILED_PRECONDITION` | 资源存在，但当前前提不满足读取要求 |

补充说明：

- `SearchSuppliers` 空页、联系人空列表、地址空列表、offering 空页都必须走正常响应语义
- phase 1 不冻结除上述列表之外的其他错误码
