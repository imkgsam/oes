# procurement-service Receiving Expectation API

## 1. 模块职责

本文件冻结 phase 1 采购侧收货预期与差异摘要 contract。

它包含两组内部 gRPC 服务面：

- `ReceivingExpectationQueryService`
- `ReceivingExpectationManagementService`

其职责是回答：

- 采购侧预期应该收到什么
- 当前还有多少未到
- 实际收货与采购预期之间是否存在摘要级差异
- 当前差异已采用什么采购侧 resolution

它不负责回答：

- 实际库存在哪里
- 仓储已上架多少
- 破损 / 受限库存如何入账
- 财务如何对账或付款

## 2. 通用上下文要求

现有 phase 1 receiving query/management RPC 都是 `BUSINESS / HUMAN / WEB`：

- 只接受 audience 为 `urn:oes:service:procurement-service`、与 mTLS client certificate 绑定的有效 ExecutionToken
- tenant、适用时的 org、operator、trace 与 audit 都由 verified claims 派生
- request body 与 legacy metadata 中的同名字段均不再是 authority

WMS 只使用 [internal-query.md](/Users/acehood/Documents/GitHub/oes/docs/contracts/procurement-service/internal-query.md) 中的窄 `ResolveReceivingExpectationForReceipt`，不得复用本文件的 Gateway-only query。

补充约束：

- ExecutionToken 或 claims-derived context 缺失、无效、过期、audience/certificate 不匹配时 fail closed
- 不冻结 event payload、inventory adjustment contract 或 WMS message schema

## 3. 边界与基线语义

### 3.1 `ReceivingExpectation` 边界

- `ReceivingExpectation` 是采购侧预期收货真相
- 它表达：
  - 采购侧应收什么
  - 预计何时到
  - 当前还有多少未到
- 同一 `PO line` 可按目标仓 / 收货地址 / allocation grouping 拆分出多个 expectation
- 它不是 `WMS receipt` truth
- 它不是库存真相、区位真相或库存状态真相

### 3.2 `ReceivingDiscrepancy` 边界

- `ReceivingDiscrepancy` 记录采购侧“预期与实收不一致”的摘要
- 它是采购侧 resolution 入口，不是库存调整真相
- phase 1 必须允许差异进入受控处理，而不是只支持自动补单
- resolution 只记录采购侧处置选择与引用，不直接修改库存真相

### 3.3 Procurement 与 WMS 边界

- `WMS receipt` 才是实际收货真相
- procurement 只消费实际收货结果来更新 expectation / discrepancy 视图
- phase 1 不冻结 Procurement 直接写 `WMS receipt`
- phase 1 不冻结 inventory adjustment、restricted stock、damaged stock 的仓储处理 contract
- 若要关闭剩余未收数量，必须通过 `PurchaseOrderChange` 留痕，再由 Procurement 更新 expectation / discrepancy 摘要

### 3.4 Resolution 边界

- `RecordReceivingDiscrepancyResolution` 只记录采购侧当前采用的 resolution
- phase 1 必须覆盖以下差异与 resolution：
  - `SHORT_RECEIVED`
    - `WAIT_REDELIVERY`
    - `CLOSE_UNRECEIVED`
    - `REQUEST_RESEND`
  - `OVER_RECEIVED`
    - `ACCEPT_WITH_PO_CHANGE`
    - `REJECT_EXCESS`
    - `TEMP_HOLD`
  - `DAMAGED`
    - `REJECT_DAMAGED`
    - `RECEIVE_WITH_RESTRICTION`
    - `CLAIM`
    - `REQUEST_RESEND`
  - `WRONG_ITEM`
    - `REJECT_WRONG_ITEM`
    - `TEMP_RECEIVE_PENDING_DECISION`
    - `ACCEPT_WITH_CONTROLLED_CHANGE`
  - `QUALITY_HOLD`
    - `WAIT_INSPECTION`
    - `CLAIM`
    - `ACCEPT_WITH_ALLOWANCE`
    - `RETURN_TO_SUPPLIER`
- phase 1 不冻结完整差异 workflow、审批、供应商赔偿或财务冲销语义
- phase 1 的 `return / claim` 只保留 resolution 类型与引用，不展开完整 `SupplierReturn / claim workflow`

## 4. 通用读取对象

### 4.1 `ReceivingExpectation`

phase 1 `ReceivingExpectation` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `receiving_expectation_id` | expectation 标识 |
| `purchase_order_id` | 所属 PO 标识 |
| `purchase_order_line_id` | 所属 PO 行标识 |
| `supplier_id` | 供应商标识 |
| `allocation_grouping_key` | expectation 分组键摘要 |
| `source_allocation_ids[]` | 构成该 expectation 的 allocation 标识集合 |
| `target_warehouse_id` | optional 目标仓摘要 |
| `target_receiving_address_id` | optional 目标收货地址标识 |
| `expected_quantity` | 预期应收数量 |
| `received_quantity_summary` | 当前已收数量摘要 |
| `open_quantity` | 当前未收数量 |
| `expected_receipt_date` | optional 预计到货日期 |
| `status` | `OPEN / PARTIALLY_RECEIVED / COMPLETED / CANCELLED` |
| `discrepancy` | optional 当前差异摘要 |
| `created_at` | 创建时间 |
| `updated_at` | 最近更新时间 |

说明：

- `received_quantity_summary` 是采购侧消费 `WMS` 结果后的摘要，不把 `WMS` owner truth 转移过来
- `allocation_grouping_key` 只服务于 expectation 拆分与追踪，不改变 `PO allocation` owner
- `COMPLETED` 只表示 expectation 已闭合，不等于库存调整或财务结算已完成

### 4.2 `ReceivingDiscrepancy`

phase 1 `ReceivingDiscrepancy` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `receiving_discrepancy_id` | discrepancy 标识 |
| `discrepancy_type` | `SHORT_RECEIVED / OVER_RECEIVED / DAMAGED / WRONG_ITEM / QUALITY_HOLD` |
| `summary` | 差异摘要说明 |
| `status` | `OPEN / RESOLVED` |
| `resolution_code` | optional 当前 resolution 摘要 |
| `resolution_note` | optional 处理说明 |
| `resolution_references[]` | optional 当前 resolution 引用摘要 |
| `resolved_at` | optional 关闭时间 |

说明：

- `resolution_references[]` 只保存采购侧处置引用，例如 `PurchaseOrderChange`、return reference、claim reference 或附件引用
- discrepancy resolution 成功不等于仓储或财务动作已完成

### 4.3 `ReceivingDiscrepancyResolutionReference`

phase 1 `resolution_references[]` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `reference_type` | `PURCHASE_ORDER_CHANGE / RETURN_REFERENCE / CLAIM_REFERENCE / ATTACHMENT_REF / OTHER` |
| `reference_id` | 外部引用标识 |

### 4.4 `ReceivingExpectationSummary`

phase 1 列表读取最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receiving_expectation_id` | expectation 标识 |
| `purchase_order_id` | PO 标识 |
| `purchase_order_line_id` | PO 行标识 |
| `supplier_id` | 供应商标识 |
| `target_warehouse_id` | optional 目标仓摘要 |
| `target_receiving_address_id` | optional 目标收货地址标识 |
| `expected_receipt_date` | optional 预计到货日期 |
| `open_quantity` | 当前未收数量 |
| `status` | 当前状态 |
| `has_open_discrepancy` | 是否存在未关闭差异 |

## 5. Query RPC 语义

### `GetReceivingExpectation`

- 作用：按 `receiving_expectation_id` 读取单个 `ReceivingExpectation`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `receiving_expectation_id` | 是 | 目标 expectation 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receiving_expectation` | 单个 `ReceivingExpectation` 读取模型 |

空语义：

- 目标 expectation 存在时返回 `receiving_expectation`
- 目标 expectation 不存在时返回 `NOT_FOUND`

### `SearchReceivingExpectations`

- 作用：按条件分页搜索采购侧未收 / 差异 expectation 目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `purchase_order_id` | 否 | 按 PO 过滤 |
| `supplier_id` | 否 | 按供应商过滤 |
| `status` | 否 | 按 expectation 状态过滤 |
| `has_open_discrepancy` | 否 | 是否只看存在未关闭差异的 expectation |
| `target_warehouse_id` | 否 | 按目标仓过滤 |
| `target_receiving_address_id` | 否 | 按目标收货地址过滤 |
| `expected_receipt_date_from` | 否 | 预计到货起始日 |
| `expected_receipt_date_to` | 否 | 预计到货截止日 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receiving_expectations[]` | 当前页 `ReceivingExpectationSummary` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

## 6. Management RPC 语义

### `CreateReceivingExpectation`

- 作用：为已发 `PO line` 建立采购侧 expectation

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `purchase_order_id` | 是 | 所属 PO 标识 |
| `purchase_order_line_id` | 是 | 所属 PO 行标识 |
| `allocation_grouping_key` | 是 | expectation 分组键 |
| `source_allocation_ids[]` | 是 | 该 expectation 覆盖的 allocation 集合 |
| `target_warehouse_id` | 否 | optional 目标仓摘要 |
| `target_receiving_address_id` | 否 | optional 目标收货地址标识 |
| `expected_quantity` | 是 | 预期应收数量 |
| `expected_receipt_date` | 否 | optional 预计到货日期 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receiving_expectation` | 新建后的 `ReceivingExpectation` |

关键语义：

- 只允许基于已发 `PO line`
- expectation 是采购侧对象，不得在该命令内伪造 `WMS receipt`
- 同一 `PO line` 可创建多个 expectation，前提是它们属于不同目标仓 / 收货地址 / allocation grouping
- phase 1 允许在 `IssuePurchaseOrder` 后由受控流程显式创建 expectation，也允许由 integration adapter 按同一黑盒语义创建

### `RecordReceivingDiscrepancyResolution`

- 作用：记录某个采购侧 discrepancy 的当前 resolution

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `receiving_expectation_id` | 是 | 目标 expectation 标识 |
| `receiving_discrepancy_id` | 是 | 目标 discrepancy 标识 |
| `resolution_code` | 是 | 必须与 discrepancy type 匹配的 phase 1 resolution code |
| `resolution_note` | 否 | optional 处理说明 |
| `resolution_references[]` | 否 | optional 采购侧处置引用 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `receiving_expectation` | 更新后的 `ReceivingExpectation` |
| `receiving_discrepancy` | 更新后的 `ReceivingDiscrepancy` |

关键语义：

- 本命令只记录采购侧当前 resolution
- 它不直接创建库存调整、退货单、补货单或财务冲销对象
- 若 resolution 是 `CLOSE_UNRECEIVED` 或 `ACCEPT_WITH_PO_CHANGE`，必须引用相应 `PurchaseOrderChange`
- phase 1 的 return / claim 只记录 `resolution_code + resolution_references[]`
- 若 resolution 导致 expectation 关闭，服务可把 discrepancy 标记为 `RESOLVED`

## 7. 错误语义

phase 1 receiving 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、数量非法、expectation grouping 非法，或 resolution code 与 discrepancy type 不匹配 |
| `UNAUTHENTICATED` | 缺少有效且 certificate-bound 的 Procurement ExecutionToken，或 token/claims-derived context 校验失败 |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有在该 tenant / org / expectation 上执行命令或读取的权限 |
| `NOT_FOUND` | 目标 `ReceivingExpectation / ReceivingDiscrepancy / PurchaseOrder / PurchaseOrderLine` 不存在 |
| `ALREADY_EXISTS` | 当前命令违反唯一性约束，例如重复创建 current expectation |
| `FAILED_PRECONDITION` | 资源存在，但当前状态不满足命令前提，例如对未发 `PO` 创建 expectation、对已关闭 discrepancy 再次写 resolution，或需要关闭剩余未收数量但缺少 `PurchaseOrderChange` 引用 |
| `UNAVAILABLE` | 下游依赖或当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- `SearchReceivingExpectations` 空页必须走正常响应语义
- 采购侧 discrepancy resolution 成功不等于仓储或财务动作已完成

## 8. Deferred

以下 receiving 相关能力明确 deferred：

- 采购侧与 `WMS` 的完整事件目录与 payload
- inventory adjustment contract
- damaged / restricted 库存处置真相
- 供应商赔偿 / 索赔 / debit note
- 完整 `SupplierReturn / claim workflow`
- 财务对账、发票匹配、付款影响
- 完整 discrepancy workflow / approval
