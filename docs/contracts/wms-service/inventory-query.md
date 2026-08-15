# wms-service Inventory Query API

## 1. 模块职责

`InventoryQueryService` 负责 phase 1 WMS 库存事实与库存快照的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`InventoryQueryService`
- 分类：`BUSINESS / HUMAN / WEB`
- direct caller：仅 `api-gateway`
- audience：`urn:oes:service:wms-service`
- tenant、适用 org、operator 与 trace 只从 verified ET/transport context 派生；request body 不承载 authority

phase 1 query 只覆盖：

- `StockLedgerEntry` 目录搜索
- 单个 `InventoryBalance` 读取
- `InventoryBalance` 目录搜索

phase 1 query 不覆盖：

- inventory adjustment command
- outbound / shipment inventory view
- transfer ledger
- cycle count discrepancy view

## 2. 通用读取对象

### 2.1 `StockLedgerEntry`

phase 1 `StockLedgerEntry` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `stock_ledger_entry_id` | ledger entry 稳定标识 |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `entry_type` | 固定为 `RECEIPT_POSTED` |
| `direction` | 固定为 `IN` |
| `warehouse_id` | 影响仓库标识 |
| `location_id` | 影响 location 标识 |
| `item_id` | Item 标识 |
| `item_code` | optional Item 编码摘要 |
| `item_name` | optional Item 名称摘要 |
| `quantity_delta` | 数量增量 |
| `uom` | 计量单位摘要 |
| `inventory_status` | `AVAILABLE / RESTRICTED` |
| `restricted_reason` | optional `RestrictedStatusReason` |
| `source_document_type` | 固定为 `RECEIPT` |
| `source_document_id` | `Receipt.receipt_id` |
| `source_document_line_id` | `ReceiptLine.receipt_line_id` |
| `receiving_expectation_id` | optional expectation 引用 |
| `tracking_refs[]` | optional tracking 引用 |
| `posted_at` | 过账时间 |

说明：

- `StockLedgerEntry` 是库存真相事实源
- phase 1 只承诺 `RECEIPT_POSTED`，但命名保持 posting-friendly，以避免未来 transfer / outbound / count 推翻模型
- 本对象不是 finance double-entry ledger

### 2.2 `InventoryBalance`

phase 1 `InventoryBalance` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `tenant_id` | 显式租户边界 |
| `org_id` | optional 组织边界摘要 |
| `warehouse_id` | 仓库标识 |
| `location_id` | optional location 标识；为空时表示仓级聚合快照 |
| `item_id` | Item 标识 |
| `item_code` | optional Item 编码摘要 |
| `item_name` | optional Item 名称摘要 |
| `uom` | 计量单位摘要 |
| `on_hand_quantity` | 当前总在手数量 |
| `available_quantity` | 当前可用数量 |
| `restricted_quantity` | 当前受限数量 |
| `restricted_quantities[]` | 按 reason 聚合的受限数量 |
| `last_ledger_entry_id` | 最近影响该 balance 的 ledger entry |
| `last_posted_at` | 最近过账时间 |
| `updated_at` | 最近投影刷新时间 |

说明：

- `InventoryBalance` 是 `StockLedgerEntry` 的投影 / snapshot，不是可手改 truth
- `on_hand_quantity = available_quantity + restricted_quantity`
- damaged stock 只应出现在 `restricted_quantities[]` 中的 `reason_code = DAMAGED`

### 2.3 `RestrictedStatusReason`

phase 1 `RestrictedStatusReason` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `reason_code` | `DAMAGED / QUALITY_HOLD / PENDING_IDENTIFICATION / PENDING_DECISION / OTHER` |
| `reason_note` | optional 原因说明 |

### 2.4 `InventoryBalanceRestrictedQuantity`

phase 1 `restricted_quantities[]` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `reason_code` | restricted reason code |
| `quantity` | 当前该 reason 下的受限数量 |

### 2.5 `StockLedgerEntrySummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `stock_ledger_entry_id` | ledger entry 标识 |
| `entry_type` | 固定为 `RECEIPT_POSTED` |
| `warehouse_id` | 仓库标识 |
| `location_id` | location 标识 |
| `item_id` | Item 标识 |
| `quantity_delta` | 数量增量 |
| `uom` | 计量单位摘要 |
| `inventory_status` | 库存状态 |
| `restricted_reason_code` | optional restricted reason code |
| `source_document_id` | source receipt 标识 |
| `posted_at` | 过账时间 |

### 2.6 `InventoryBalanceSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `warehouse_id` | 仓库标识 |
| `location_id` | optional location 标识 |
| `item_id` | Item 标识 |
| `item_code` | optional Item 编码摘要 |
| `item_name` | optional Item 名称摘要 |
| `uom` | 计量单位摘要 |
| `on_hand_quantity` | 当前总在手数量 |
| `available_quantity` | 当前可用数量 |
| `restricted_quantity` | 当前受限数量 |
| `last_posted_at` | 最近过账时间 |

## 3. RPC 语义

### `SearchStockLedgerEntries`

- 作用：按条件分页搜索库存 ledger facts

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `warehouse_id` | 否 | 按仓库过滤 |
| `location_id` | 否 | 按 location 过滤 |
| `item_id` | 否 | 按 Item 过滤 |
| `receipt_id` | 否 | 按 source receipt 过滤 |
| `receipt_line_id` | 否 | 按 source receipt line 过滤 |
| `receiving_expectation_id` | 否 | 按 expectation 引用过滤 |
| `inventory_status` | 否 | 按库存状态过滤 |
| `restricted_reason_code` | 否 | 按 restricted reason 过滤 |
| `posted_at_from` | 否 | 过账时间起始 |
| `posted_at_to` | 否 | 过账时间截止 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `entries[]` | 当前页 `StockLedgerEntrySummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

### `GetInventoryBalance`

- 作用：读取一个 `warehouse + item` 或 `warehouse + location + item` 级别的当前库存快照

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `warehouse_id` | 是 | 目标仓库标识 |
| `item_id` | 是 | 目标 Item 标识 |
| `location_id` | 否 | 指定时读取 location 级快照；不指定时读取仓级聚合快照 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `inventory_balance` | 单个 `InventoryBalance` 读取模型 |

空语义：

- 目标 balance 已存在时返回 `inventory_balance`
- 目标 warehouse / item / optional location 组合当前无任何 ledger footprint 时返回 `NOT_FOUND`

补充说明：

- `NOT_FOUND` 只表示“当前没有已投影的库存足迹”，不表示调用方可以绕过 ledger 直接创建 balance

### `SearchInventoryBalances`

- 作用：按条件分页搜索库存快照目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `warehouse_id` | 否 | 按仓库过滤 |
| `location_id` | 否 | 按 location 过滤 |
| `item_id` | 否 | 按 Item 过滤 |
| `inventory_status` | 否 | `AVAILABLE / RESTRICTED / ANY` |
| `restricted_reason_code` | 否 | 按 restricted reason 过滤 |
| `only_positive_on_hand` | 否 | 是否只返回 `on_hand_quantity > 0` 的快照 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `inventory_balances[]` | 当前页 `InventoryBalanceSummary` 列表 |
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
| `UNAUTHENTICATED` | 缺少或无法验证 WMS audience、有效期或 certificate-bound HUMAN ExecutionToken |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / inventory / ledger 的权限 |
| `NOT_FOUND` | `GetInventoryBalance` 目标足迹不存在，或显式引用的 warehouse / location / item 不存在 |
| `ALREADY_EXISTS` | 当前 query RPC 不应返回该错误；该错误码只作为跨 management/query 共享的统一错误词汇保留 |
| `FAILED_PRECONDITION` | 资源存在，但当前读取前提不满足，例如 location 不属于目标 warehouse |
| `UNAVAILABLE` | 当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `SearchStockLedgerEntries` 与 `SearchInventoryBalances` 空页都必须走正常响应语义，而不是错误替代
- phase 1 不允许把 `InventoryBalance` 伪装成可被 command 直接覆盖的 truth 对象
