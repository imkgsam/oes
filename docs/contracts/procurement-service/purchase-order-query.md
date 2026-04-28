# procurement-service Purchase Order Query API

## 1. 模块职责

`PurchaseOrderQueryService` 负责 phase 1 采购承诺对象的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`PurchaseOrderQueryService`
- 所有 RPC 显式带 `tenant_id`
- 场景适用时显式带 `org_id`
- 所有 RPC 都要求：
  - internal service context
  - operator context
  - trace context

phase 1 query 只覆盖：

- `PurchaseOrder` 单对象读取
- `PurchaseOrder` 目录搜索
- `PurchaseOrderChange` 列表读取

phase 1 query 不覆盖：

- 供应商对账读模型
- `AP` matching 读模型
- `RFQ`
- `SupplierQuote`
- 采购价格分析报表
- 完整收货履约分析读模型

## 2. 通用读取对象

### 2.1 `PurchaseOrder`

phase 1 `PurchaseOrder` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order_id` | `PurchaseOrder` 稳定标识 |
| `order_no` | PO 编号摘要 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `status` | `DRAFT / ISSUED / ACKNOWLEDGED / CANCELLED` |
| `currency_code` | 交易货币摘要 |
| `supplier_id` | 目标供应商标识 |
| `supplier_snapshot` | 当前供应商快照 |
| `source_purchase_request_ids[]` | 源 PR 摘要列表 |
| `lines[]` | `PurchaseOrderLine` 列表 |
| `supplier_acknowledgement` | optional 供应商确认摘要 |
| `issued_at` | optional 发单时间 |
| `cancelled_at` | optional 取消时间 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- `PurchaseOrder` 表达正式采购承诺
- `supplier_snapshot` 是 Procurement 交易事实的一部分，不把 owner truth 从 `SRM` 转移到 Procurement
- phase 1 不在 query shape 中展开完整 commercial terms matrix

### 2.2 `PurchaseOrderSupplierSnapshot`

phase 1 `supplier_snapshot` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `supplier_id` | 供应商标识 |
| `supplier_display_name` | 供应商显示名摘要 |
| `supplier_status_at_issue` | optional 发单时的供应商状态摘要 |

说明：

- 对标准 Item 采购，snapshot 不替代 `ACTIVE SupplierOffering` 的 issue-time 校验
- 对日常非标准采购，snapshot 是必须保留的交易快照

### 2.3 `PurchaseOrderLine`

phase 1 `PurchaseOrderLine` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order_line_id` | PO 行标识 |
| `line_no` | 行号 |
| `line_type` | `STANDARD_ITEM / TEXT` |
| `item_id` | 标准 Item 行必有；文本行为空 |
| `item_code` | optional Item 编码摘要 |
| `item_name` | optional Item 名称摘要 |
| `description` | 行说明；文本行必须返回，标准行可补充说明 |
| `supplier_offering_id` | optional 标准 Item 行的 offering 引用摘要 |
| `ordered_quantity` | 采购数量 |
| `uom` | 计量单位摘要 |
| `ordered_unit_price` | optional 单价摘要 |
| `source_purchase_request_line_id` | optional 源 PR 行标识 |
| `general_stock_excess_reason` | optional 超出 PR 需求时的原因 |
| `allocations[]` | `PurchaseOrderLineAllocation` 列表 |

说明：

- `STANDARD_ITEM` 行应表达 issue-time 成立的 supplier offering 校验结果
- `TEXT` 行可不依赖 `SupplierOffering`
- 历史采购价格事实以 `ordered_unit_price + currency_code` 为第一阶段最小交易快照基础

### 2.4 `PurchaseOrderLineAllocation`

phase 1 `PurchaseOrderLineAllocation` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `allocation_type` | `SALES_ORDER_LINE / FULFILLMENT_DEMAND / GENERAL_STOCK` |
| `reference_id` | dedicated allocation 的目标引用；`GENERAL_STOCK` 为空 |
| `quantity` | 分配数量 |
| `reason` | optional 分配原因；超额 general stock 时必须存在 |

说明：

- 同一 `PO line` 必须允许 mixed allocation
- `GENERAL_STOCK` 分配不等于库存真相，只表达采购意图归因

### 2.5 `PurchaseOrderSupplierAcknowledgement`

phase 1 `supplier_acknowledgement` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `acknowledgement_status` | `PENDING / ACKNOWLEDGED` |
| `acknowledged_at` | optional 确认时间 |
| `external_reference` | optional 供应商回执号或确认摘要 |
| `comment` | optional 备注 |

### 2.6 `PurchaseOrderChange`

phase 1 `PurchaseOrderChange` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order_change_id` | 变更记录标识 |
| `purchase_order_id` | 所属 PO 标识 |
| `change_type` | 变更类型摘要 |
| `change_summary` | 变更摘要 |
| `change_reason` | optional 变更原因 |
| `applied_by` | 执行人摘要 |
| `applied_at` | 应用时间 |
| `status` | 固定为 `APPLIED` |

说明：

- phase 1 的 `PurchaseOrderChange` 只要求记录“已应用事实”
- 不在 query 侧展开变更申请、审批、供应商协商过程

### 2.7 `PurchaseOrderSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order_id` | PO 标识 |
| `order_no` | PO 编号摘要 |
| `status` | 当前状态 |
| `supplier_id` | 供应商标识 |
| `supplier_display_name` | 供应商显示名摘要 |
| `currency_code` | 货币摘要 |
| `line_count` | 行数摘要 |
| `issued_at` | optional 发单时间 |
| `created_at` | 创建时间 |

## 3. RPC 语义

### `GetPurchaseOrder`

- 作用：按 `purchase_order_id` 读取单个 `PurchaseOrder`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_order_id` | 是 | 目标 PO 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order` | 单个 `PurchaseOrder` 读取模型 |

空语义：

- 目标 `PurchaseOrder` 存在时返回 `purchase_order`
- 目标 `PurchaseOrder` 不存在时返回 `NOT_FOUND`

### `SearchPurchaseOrders`

- 作用：按条件分页搜索采购订单目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 按组织范围过滤 |
| `keyword` | 否 | 按 `order_no / supplier / source_pr_no` 轻量检索 |
| `status` | 否 | 按 `PO` 状态过滤 |
| `supplier_id` | 否 | 按供应商过滤 |
| `item_id` | 否 | 按标准 Item 行过滤 |
| `request_no` | 否 | 按源 PR 编号过滤 |
| `issued_from` | 否 | 发单起始时间 |
| `issued_to` | 否 | 发单截止时间 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_orders[]` | 当前页 `PurchaseOrderSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

### `ListPurchaseOrderChanges`

- 作用：列出某个 `PO` 当前已记录的 `PurchaseOrderChange`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_order_id` | 是 | 目标 PO 标识 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `changes[]` | 当前页 `PurchaseOrderChange` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 目标 `PurchaseOrder` 不存在时返回 `NOT_FOUND`
- 目标 `PurchaseOrder` 存在但当前没有变更记录时，返回空页

## 4. 错误语义

phase 1 query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法或搜索条件冲突 |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context 或 trace context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / org / PO 的权限 |
| `NOT_FOUND` | `GetPurchaseOrder` 的目标 PO 不存在，或 `ListPurchaseOrderChanges` 的目标 PO 不存在 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `SearchPurchaseOrders` 空页、`ListPurchaseOrderChanges` 空页都必须走正常响应语义
- phase 1 query 不使用 `ALREADY_EXISTS`
