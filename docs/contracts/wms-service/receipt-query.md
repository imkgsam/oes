# wms-service Receipt Query API

## 1. 模块职责

`ReceiptQueryService` 负责 phase 1 实际收货 truth 的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`ReceiptQueryService`
- 所有 RPC 显式带 `tenant_id`
- 场景适用时显式带 `org_id`
- 所有 RPC 都要求：
  - internal service context
  - operator context
  - trace context

phase 1 query 只覆盖：

- `Receipt` 单对象读取
- `Receipt` 目录搜索
- `ReceiptLine` 单对象读取
- `ReceiptLine` 目录搜索

phase 1 query 不覆盖：

- supplier-facing discrepancy resolution
- procurement expectation lifecycle
- outbound / shipment receipt fulfillment
- package hierarchy query

## 2. 通用读取对象

### 2.1 `Receipt`

phase 1 `Receipt` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt_id` | `Receipt` 稳定标识 |
| `receipt_no` | 收货单号 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `warehouse_id` | 所属仓库标识 |
| `status` | `DRAFT / POSTED / CANCELLED` |
| `receipt_source_type` | `MANUAL / RECEIVING_EXPECTATION_REFERENCE` |
| `referenced_receiving_expectation_ids[]` | optional 被引用 expectation 摘要集合 |
| `receipt_date` | 收货日期 |
| `note` | optional 收货备注 |
| `attachment_refs[]` | optional 证据附件引用 |
| `line_count` | 行数摘要 |
| `posted_at` | optional 过账时间 |
| `cancelled_at` | optional 取消时间 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |
| `lines[]` | `ReceiptLine` 列表 |

说明：

- `Receipt` 是 WMS 实际收货 truth，不是采购预期状态机
- `Receipt.status` 不能表达 `ReceivingExpectation` 是否关闭、是否补发、是否索赔
- `attachment_refs[]` 只是 evidence 引用，不转移文件 owner truth

### 2.2 `ReceiptLine`

phase 1 `ReceiptLine` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt_line_id` | `ReceiptLine` 稳定标识 |
| `receipt_id` | 所属 receipt 标识 |
| `line_no` | 行号 |
| `item_id` | 收货 Item 标识 |
| `item_code` | optional Item 编码摘要 |
| `item_name` | optional Item 名称摘要 |
| `receiving_expectation_id` | optional 关联的 `ReceivingExpectation` |
| `target_location_id` | 收货后入账的 target location |
| `confirmed_quantity` | operator-confirmed 实收数量 |
| `uom` | 收货计量单位摘要 |
| `inventory_status` | `AVAILABLE / RESTRICTED` |
| `restricted_reason` | optional `RestrictedStatusReason` |
| `tracking_refs[]` | optional tracking 引用 |
| `physical_discrepancy` | optional 物理差异事实摘要 |
| `evidence_attachment_refs[]` | optional 行级证据附件引用 |
| `posted_stock_ledger_entry_ids[]` | 过账后生成的 ledger entry 标识集合 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- 同一 `Receipt` 允许对同一 `Item` 建多条 line，以分别表达可用数量与受限数量
- damaged quantity 必须通过 `inventory_status = RESTRICTED + restricted_reason.reason_code = DAMAGED` 表达
- `ReceiptLine` 只记录 physical discrepancy fact，不记录 supplier-facing resolution

### 2.3 `RestrictedStatusReason`

phase 1 `RestrictedStatusReason` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `reason_code` | `DAMAGED / QUALITY_HOLD / PENDING_IDENTIFICATION / PENDING_DECISION / OTHER` |
| `reason_note` | optional 原因说明 |

说明：

- `DAMAGED` 是 restricted stock 的一种 reason，不是单独库存总账
- 若 `inventory_status = AVAILABLE`，则不能返回 `restricted_reason`

### 2.4 `ReceiptTrackingRef`

phase 1 `tracking_refs[]` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `tracking_ref_type` | `BOX_CODE / UNIT_CODE / EXTERNAL_CODE / FREE_TEXT` |
| `tracking_ref_value` | 引用值 |

说明：

- `tracking_refs[]` 只保留 operator 输入或外部带入的 tracking 引用
- phase 1 不把它升级为完整 barcode platform contract

### 2.5 `ReceiptPhysicalDiscrepancy`

phase 1 `physical_discrepancy` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `discrepancy_type` | `SHORT_RECEIVED / OVER_RECEIVED / DAMAGED / WRONG_ITEM / QUALITY_HOLD / OTHER` |
| `discrepancy_quantity` | optional 差异数量摘要 |
| `note` | optional 差异说明 |

说明：

- 这是 WMS physical fact，不是采购 resolution
- `QUALITY_HOLD` 在 phase 1 只表示物理上进入受控待判状态，不展开完整 quality workflow

### 2.6 `ReceiptSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt_id` | receipt 标识 |
| `receipt_no` | 收货单号 |
| `warehouse_id` | 所属仓库标识 |
| `status` | 当前状态 |
| `receipt_source_type` | 收货来源类型 |
| `receipt_date` | 收货日期 |
| `line_count` | 行数摘要 |
| `posted_at` | optional 过账时间 |
| `has_restricted_lines` | 是否存在受限行 |
| `has_physical_discrepancy` | 是否存在物理差异事实 |

### 2.7 `ReceiptLineSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt_line_id` | receipt line 标识 |
| `receipt_id` | 所属 receipt 标识 |
| `receipt_no` | 所属收货单号摘要 |
| `line_no` | 行号 |
| `warehouse_id` | 所属仓库标识 |
| `item_id` | Item 标识 |
| `item_code` | optional Item 编码摘要 |
| `item_name` | optional Item 名称摘要 |
| `receiving_expectation_id` | optional expectation 引用 |
| `target_location_id` | target location |
| `confirmed_quantity` | 实收数量 |
| `uom` | 计量单位摘要 |
| `inventory_status` | 当前库存状态 |
| `restricted_reason_code` | optional restricted reason code |
| `discrepancy_type` | optional physical discrepancy type |
| `posted_at` | optional 过账时间摘要 |

## 3. RPC 语义

### `GetReceipt`

- 作用：按 `receipt_id` 读取单个 `Receipt`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `receipt_id` | 是 | 目标 receipt 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt` | 单个 `Receipt` 读取模型 |

空语义：

- 目标 `Receipt` 存在时返回 `receipt`
- 目标 `Receipt` 不存在时返回 `NOT_FOUND`

### `SearchReceipts`

- 作用：按条件分页搜索收货单目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 按组织范围过滤 |
| `warehouse_id` | 否 | 按仓库过滤 |
| `status` | 否 | 按 receipt 状态过滤 |
| `receipt_source_type` | 否 | 按来源类型过滤 |
| `receiving_expectation_id` | 否 | 按 expectation 引用过滤 |
| `keyword` | 否 | 按 `receipt_no / tracking_ref / note` 轻量检索 |
| `receipt_date_from` | 否 | 收货日期起始 |
| `receipt_date_to` | 否 | 收货日期截止 |
| `posted_at_from` | 否 | 过账时间起始 |
| `posted_at_to` | 否 | 过账时间截止 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receipts[]` | 当前页 `ReceiptSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

### `GetReceiptLine`

- 作用：按 `receipt_line_id` 读取单个 `ReceiptLine`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `receipt_line_id` | 是 | 目标 receipt line 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt_line` | 单个 `ReceiptLine` 读取模型 |

空语义：

- 目标 `ReceiptLine` 存在时返回 `receipt_line`
- 目标 `ReceiptLine` 不存在时返回 `NOT_FOUND`

### `SearchReceiptLines`

- 作用：按条件分页搜索收货行目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 按组织范围过滤 |
| `receipt_id` | 否 | 按所属 receipt 过滤 |
| `warehouse_id` | 否 | 按仓库过滤 |
| `target_location_id` | 否 | 按入账 location 过滤 |
| `item_id` | 否 | 按 Item 过滤 |
| `receiving_expectation_id` | 否 | 按 expectation 引用过滤 |
| `inventory_status` | 否 | 按库存状态过滤 |
| `restricted_reason_code` | 否 | 按 restricted reason 过滤 |
| `discrepancy_type` | 否 | 按 physical discrepancy 类型过滤 |
| `posted_at_from` | 否 | 过账时间起始 |
| `posted_at_to` | 否 | 过账时间截止 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt_lines[]` | 当前页 `ReceiptLineSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

## 4. 错误语义

phase 1 query 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法或搜索条件冲突 |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context 或 trace context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / receipt / receipt line 的权限 |
| `NOT_FOUND` | 单对象读取目标不存在，例如 `receipt_id` 或 `receipt_line_id` 不存在 |
| `ALREADY_EXISTS` | 当前 query RPC 不应返回该错误；该错误码只作为跨 management/query 共享的统一错误词汇保留 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足 |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `SearchReceipts` 与 `SearchReceiptLines` 空页都必须走正常响应语义，而不是错误替代
- `Receipt.status` 只表达 WMS 收货生命周期，不能被当作采购差异 resolution 状态使用
