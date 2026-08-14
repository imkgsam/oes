# wms-service Receipt Management API

## 1. 模块职责

`ReceiptManagementService` 负责 phase 1 WMS 实际收货对象的命令型写接口。

## 2. 通用上下文要求

所有 phase 1 management command 统一要求：

- `tenant_id`
- 场景适用时的 `org_id`
- internal service context
- operator context
- trace context
- audit context

补充约束：

- 本文件只冻结“必须要求这些上下文存在”，不展开完整内部字段结构
- 所有 command 都必须按 command 语义处理，不得被调用方当作 query 或同步缓存接口使用
- phase 1 不冻结 command metadata header、幂等键设计、审计落库结构或重试策略

## 3. 写入基线语义

### 3.1 `Receipt` 边界

- `Receipt` 是 WMS 实际收货 truth，不是采购预期 truth。
- `CreateReceiptDraft` 与 `AddOrReplaceReceiptLines` 只维护未过账的草稿收货对象。
- `PostReceipt` 是 phase 1 实际收货写入库存 truth 的关键命令。
- `CancelReceiptDraft` 只取消草稿，不负责已过账收货冲销。
- phase 1 不把已过账 receipt reversal / inventory adjustment 混入当前命令面。

### 3.2 `ReceiptLine` 边界

- `ReceiptLine.confirmed_quantity` 表达 operator-confirmed 实收数量。
- 同一 `Receipt` 允许多条 line 指向同一 `Item`，用于拆分可用 / 受限数量或不同 target location。
- `tracking_refs[]` 是 optional trace 引用，不等于条码平台 owner truth。
- `attachmentRef` 只作为证据引用，不等于文件主档。

### 3.3 Procurement 边界

- `Receipt` 或 `ReceiptLine` 可以 optional 引用 `ReceivingExpectation`。
- 显式 expectation 引用的校验只走 Procurement 的窄 `ResolveReceivingExpectationForReceipt`，固定为 `INTERNAL / HUMAN_OBO`；WMS actor 必须是 `wms-service`，不得复用 Gateway-only `GetReceivingExpectation`。
- 当前 dedicated caller 只准备不激活；WMS trusted inbound 完成后才可用 verified HUMAN 上游 proof 换取 Procurement audience ET，缺少 proof/credential/ET 时 fail closed，禁止 legacy fallback。
- WMS 记录的是 physical discrepancy fact，不是 supplier-facing resolution。
- `PostReceipt` 成功后必须 emits/records receipt summary for Procurement。
- `Receipt.status` 绝不能并入 `ReceivingExpectation` 状态机。
- 关闭剩余未收、补发、索赔、退货继续归 `procurement-service`。

### 3.4 Inventory 边界

- `PostReceipt` 成功后必须生成 `StockLedgerEntry` truth。
- `InventoryBalance` 必须由 ledger 投影 / snapshot 刷新，不允许绕过 ledger 直接改成 truth。
- damaged stock 必须通过 `inventory_status = RESTRICTED` 与 `restricted_reason.reason_code = DAMAGED` 入账。

## 4. RPC 语义

### `CreateReceiptDraft`

- 作用：创建一个新的收货草稿

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `warehouse_id` | 是 | 所属仓库标识 |
| `receipt_source_type` | 是 | `MANUAL / RECEIVING_EXPECTATION_REFERENCE` |
| `receipt_date` | 否 | 收货日期；未传时由服务记录当前日期 |
| `referenced_receiving_expectation_ids[]` | 否 | optional expectation 引用集合 |
| `note` | 否 | optional 收货备注 |
| `attachment_refs[]` | 否 | optional 证据附件引用 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt` | 新建后的 `Receipt` |

关键语义：

- 成功创建后状态必须为 `DRAFT`
- 本命令允许纯 manual receiving，不要求必须先有 `ReceivingExpectation`
- 若 `receipt_source_type = RECEIVING_EXPECTATION_REFERENCE`，则允许 header 先保留 expectation 引用摘要，后续再由 line 逐条落具体引用

### `AddOrReplaceReceiptLines`

- 作用：为一个 `DRAFT` receipt 全量写入或替换其收货行集合

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `receipt_id` | 是 | 目标 receipt 标识 |
| `lines[]` | 是 | 草稿最终应保存的完整行集合 |

`lines[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `receipt_line_id` | 否 | 更新既有行时填写；新增时为空 |
| `item_id` | 是 | 收货 Item 标识 |
| `receiving_expectation_id` | 否 | optional expectation 引用 |
| `target_location_id` | 是 | 入账 target location |
| `confirmed_quantity` | 是 | operator-confirmed 实收数量 |
| `uom` | 是 | 计量单位摘要 |
| `inventory_status` | 是 | `AVAILABLE / RESTRICTED` |
| `restricted_reason` | 否 | `RESTRICTED` 时必填 |
| `tracking_refs[]` | 否 | optional tracking 引用 |
| `physical_discrepancy` | 否 | optional physical discrepancy 摘要 |
| `evidence_attachment_refs[]` | 否 | optional 行级证据附件引用 |

`restricted_reason` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `reason_code` | 是 | `DAMAGED / QUALITY_HOLD / PENDING_IDENTIFICATION / PENDING_DECISION / OTHER` |
| `reason_note` | 否 | optional 原因说明 |

`tracking_refs[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tracking_ref_type` | 是 | `BOX_CODE / UNIT_CODE / EXTERNAL_CODE / FREE_TEXT` |
| `tracking_ref_value` | 是 | 引用值 |

`physical_discrepancy` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `discrepancy_type` | 是 | `SHORT_RECEIVED / OVER_RECEIVED / DAMAGED / WRONG_ITEM / QUALITY_HOLD / OTHER` |
| `discrepancy_quantity` | 否 | optional 差异数量 |
| `note` | 否 | optional 差异说明 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt` | 更新后的 `Receipt` |

关键语义：

- 本命令只允许作用于 `DRAFT`
- `lines[]` 采用全量替换语义
- 每条 line 的 `confirmed_quantity` 必须大于 `0`
- 当 `inventory_status = RESTRICTED` 时，`restricted_reason` 必须存在
- 当 `inventory_status = AVAILABLE` 时，不允许传入 `restricted_reason`
- damaged 行必须通过 `RESTRICTED + reason_code = DAMAGED` 表达
- `target_location_id` 必须是承担库存责任的 internal location；非 stock-responsible work area 不得作为 target
- mixed coded / uncoded `tracking_refs[]` 允许并存

### `PostReceipt`

- 作用：把一个 `DRAFT` receipt 正式过账为库存 truth，并生成 ledger entry

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `receipt_id` | 是 | 目标 receipt 标识 |
| `post_comment` | 否 | optional 过账备注 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt` | 过账后的 `Receipt` |
| `posted_stock_ledger_entry_ids[]` | 本次过账生成的 ledger entry 标识集合 |

关键语义：

- 只允许从 `DRAFT -> POSTED`
- 过账成功前必须同步校验：
  - `warehouse_id` 当前存在且属于当前 tenant
  - `target_location_id` 当前存在、属于该 `warehouse_id`，并承担库存责任
  - `item_id` 当前存在
  - `item_id` 当前具备 `stockable` 能力
  - 若显式引用 `receiving_expectation_id`，则通过 `ResolveReceivingExpectationForReceipt` 证明该 expectation 在 verified tenant 中存在；返回 projection 不新增 active/open 业务规则
- 本命令成功后必须：
  - 为每条 receipt line 生成对应 `StockLedgerEntry`
  - 刷新受影响的 `InventoryBalance`
  - 持久化可供 Procurement 消费的 receipt summary / physical discrepancy summary
- 本命令不负责：
  - 自动关闭 `ReceivingExpectation`
  - 自动决定 supplier return / claim / resend resolution
  - 自动执行 quality workflow

### `CancelReceiptDraft`

- 作用：取消一个尚未过账的收货草稿

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `receipt_id` | 是 | 目标 receipt 标识 |
| `cancel_reason` | 是 | 取消原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receipt` | 取消后的 `Receipt` |

关键语义：

- 只允许取消 `DRAFT`
- 取消后状态必须为 `CANCELLED`
- 本命令不允许用于冲销已 `POSTED` 的 receipt
- 已过账收货的冲销 / 调整必须进入 future inventory adjustment contract，而不是复用草稿取消

## 5. 错误语义

phase 1 management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、数量非法、`RESTRICTED` 缺少 reason、`AVAILABLE` 非法携带 reason、tracking ref 非法、physical discrepancy 字段冲突，或 line 指向了不允许的 target location |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context、trace context 或 audit context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有在该 tenant / org / receipt 上执行命令的权限 |
| `NOT_FOUND` | 目标 `Receipt`、`Warehouse`、`Location`、`Item` 或显式引用的 `ReceivingExpectation` 不存在 |
| `ALREADY_EXISTS` | 当前命令违反唯一性约束，例如重复有效引用或重复稳定编号冲突 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态或外部真相不满足命令前提，例如对非 `DRAFT` 更新 / 过账 / 取消，`Item` 当前不具备 `stockable` 能力，location 不属于该 warehouse，或试图把 `DAMAGED` 作为非 restricted 库存入账 |
| `UNAVAILABLE` | 下游依赖或当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `ReceivingExpectation` 引用校验失败不应改写为 `Receipt.status` 语义；应直接返回 `NOT_FOUND` 或 `FAILED_PRECONDITION`
- 供应商侧 resolution 未完成不是 `PostReceipt` 的阻塞条件；WMS 只负责写入物理收货与库存 truth
