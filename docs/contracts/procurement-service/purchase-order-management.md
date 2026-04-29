# procurement-service Purchase Order Management API

## 1. 模块职责

`PurchaseOrderManagementService` 负责 phase 1 采购承诺对象的命令型写接口。

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

### 3.1 `PurchaseOrder` 边界

- `PurchaseOrder` 是正式采购承诺，不是采购需求
- `CreatePurchaseOrderDraft` 与 `UpdatePurchaseOrderDraft` 只维护未发出的草稿承诺
- `IssuePurchaseOrder` 是 phase 1 采购交易成立的关键命令
- phase 1 不把 `CreatePurchaseOrderDraft` 设计成 `Non-PO purchase` 正常入口
- `PO` header 可保存 `payment_terms_snapshot` 与 supplier commercial terms snapshot，但它们只属于本次采购快照

### 3.2 Supplier / Item 校验边界

- 标准 `Item` 发单前必须同步校验：
  - 目标供应商当前为 `ACTIVE`
  - 目标 Item 当前存在
  - 目标 Item 当前 `purchasable`
  - 目标供应商当前存在 `ACTIVE SupplierOffering`
- 日常非标准采购可不强制依赖 `ACTIVE SupplierOffering`
- 无论标准或文本型采购，发单时都必须保留 supplier snapshot
- Procurement 不把价格、`MOQ`、账期、lead time 回写成 `SRM` owner truth

### 3.3 Allocation 边界

- 每条 `PO line` 都必须能够表达 mixed allocation
- allocation 必须支持记录以下 source：
  - `PurchaseRequestLine`
  - `SalesOrderLine`
  - `FulfillmentDemand`
  - `GeneralStock`
- 当 `PO line quantity` 超出源 `PR demand quantity` 时：
  - 超出部分必须标记为 `GENERAL_STOCK`
  - 必须记录 `general_stock_excess_reason`
- allocation 可携带目标仓 / 收货地址；若同一 `PO line` 指向不同目标，则后续必须拆分多个 `ReceivingExpectation`

### 3.4 Change 边界

- phase 1 `PurchaseOrderChange` 只记录已应用变更事实
- `ApplyPurchaseOrderChange` 必须返回更新后的 `PO` 与新增的 `APPLIED change`
- phase 1 不在本命令上冻结完整变更申请 / 审批 / 供应商协商闭环
- 关闭剩余未收数量必须通过 `ApplyPurchaseOrderChange` 留痕，不得在收货差异 resolution 中隐式修改 `PO` 开放数量

### 3.5 历史采购价格边界

- `PO line` 交易快照是 Procurement 历史采购价格事实来源
- phase 1 最小价格快照字段为：
  - `currency_code`
  - `ordered_unit_price`
- phase 1 不把这些价格事实转移给 `SRM` 或 `Finance`

## 4. RPC 语义

### `CreatePurchaseOrderDraft`

- 作用：创建一个新的 `PO` 草稿

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `org_id` | 否 | 适用时的组织边界 |
| `supplier_id` | 是 | 目标供应商标识 |
| `currency_code` | 是 | 交易货币摘要 |
| `payment_terms_snapshot` | 否 | optional 本次采购付款条款快照 |
| `supplier_commercial_terms_snapshot` | 否 | optional 本次采购商业条款快照 |
| `source_purchase_request_ids[]` | 否 | 关联的源 PR 摘要 |
| `lines[]` | 否 | 初始 PO 行集合 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order` | 新建后的 `PurchaseOrder` |

关键语义：

- 成功创建后状态必须为 `DRAFT`
- 本命令允许先建立草稿，再由 `UpdatePurchaseOrderDraft` 补全明细
- 本命令不是 phase 1 正常 `Non-PO purchase` 入口
- `payment_terms_snapshot` 与 `supplier_commercial_terms_snapshot` 只保存本次交易快照，不成为 `SRM` 主档写入入口

### `UpdatePurchaseOrderDraft`

- 作用：更新一个现有 `DRAFT` PO 的可编辑内容

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_order_id` | 是 | 目标 PO 标识 |
| `supplier_id` | 是 | 目标供应商标识 |
| `currency_code` | 是 | 交易货币摘要 |
| `payment_terms_snapshot` | 否 | optional 本次采购付款条款快照 |
| `supplier_commercial_terms_snapshot` | 否 | optional 本次采购商业条款快照 |
| `source_purchase_request_ids[]` | 否 | 当前关联 PR 摘要 |
| `lines[]` | 是 | 草稿最终应保存的完整行集合 |

`lines[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `purchase_order_line_id` | 否 | 更新既有行时填写；新增时为空 |
| `line_type` | 是 | `STANDARD_ITEM / TEXT` |
| `item_id` | 否 | 标准 Item 行必填 |
| `description` | 是 | 文本说明；文本行必须提供 |
| `ordered_quantity` | 是 | 采购数量 |
| `uom` | 是 | 计量单位摘要 |
| `ordered_unit_price` | 否 | optional 单价摘要 |
| `general_stock_excess_reason` | 否 | 超额 general stock 时必须提供 |
| `allocations[]` | 是 | 完整分配集合 |

`allocations[]` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `purchase_order_line_allocation_id` | 否 | 更新既有 allocation 时填写；新增时为空 |
| `allocation_source_type` | 是 | `PURCHASE_REQUEST_LINE / SALES_ORDER_LINE / FULFILLMENT_DEMAND / GENERAL_STOCK` |
| `source_reference_id` | 否 | allocation 对应的来源引用；非 `GENERAL_STOCK` 时必填 |
| `quantity` | 是 | 分配数量 |
| `reason` | 否 | general stock 或例外说明 |
| `target_warehouse_id` | 否 | optional 目标仓摘要 |
| `target_receiving_address_id` | 否 | optional 目标收货地址标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order` | 更新后的 `PurchaseOrder` |

关键语义：

- 本命令只允许作用于 `DRAFT`
- `lines[]` 采用全量替换语义
- 每行 `allocations[].quantity` 之和必须等于该行 `ordered_quantity`
- 除 `GENERAL_STOCK` 外，其余 allocation source 都必须携带 `source_reference_id`
- 若某数量来自 `PR` 转单，必须通过 `allocation_source_type = PURCHASE_REQUEST_LINE` 保留来源 `PR line`
- 若来源于 `PR` 且数量超出源需求，超出部分必须在 allocation 上表达为 `GENERAL_STOCK`
- 若同一 `PO line` 的 allocation 指向不同目标仓 / 收货地址，后续 expectation 必须按 grouping 拆分

### `IssuePurchaseOrder`

- 作用：把 `DRAFT` PO 发为正式采购承诺

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_order_id` | 是 | 目标 PO 标识 |
| `issue_comment` | 否 | optional 发单备注 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order` | 发单后的 `PurchaseOrder` |

关键语义：

- 只允许从 `DRAFT -> ISSUED`
- 发单成功前必须保留 supplier snapshot
- 发单成功前必须冻结 `payment_terms_snapshot` 与 supplier commercial terms snapshot（如有）
- 标准 `Item` 行发单成功前必须同步校验：
  - 目标供应商当前为 `ACTIVE`
  - Item 当前存在
  - Item 当前 `purchasable`
  - 目标供应商当前存在 `ACTIVE SupplierOffering`
- 文本型采购发单前仍必须校验目标供应商当前为 `ACTIVE`
- 文本型采购可不强制依赖 `ACTIVE SupplierOffering`
- 发单成功后 `PO` 才成为第一阶段正式采购交易事实

### `ConfirmSupplierAcknowledgement`

- 作用：记录供应商对已发 `PO` 的确认摘要

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_order_id` | 是 | 目标 PO 标识 |
| `external_reference` | 否 | optional 供应商回执号 |
| `comment` | 否 | optional 确认备注 |
| `acknowledged_at` | 否 | optional 供应商确认时间；未传时由服务记录当前时间 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order` | 更新后的 `PurchaseOrder` |

关键语义：

- 只允许对已发 `PO` 记录确认摘要
- phase 1 只冻结 `ACKNOWLEDGED` 摘要事实，不冻结完整供应商回签协作流

### `ApplyPurchaseOrderChange`

- 作用：对已发 `PO` 应用一次正式变更，并记录 `APPLIED` 变更事实

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_order_id` | 是 | 目标 PO 标识 |
| `change_type` | 是 | 变更类型摘要 |
| `change_reason` | 是 | 变更原因 |
| `target_state` | 是 | 变更后应保存的受控结果摘要 |

`target_state` 最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `lines[]` | 否 | 变更后的完整 PO 行集合 |
| `supplier_acknowledgement` | 否 | 变更后的确认摘要 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order` | 变更后的 `PurchaseOrder` |
| `change` | 新增的 `PurchaseOrderChange` |

关键语义：

- 只允许对已发出的 `PO` 应用变更
- phase 1 只要求服务能够把变更结果与已应用留痕一起保存
- 若目的是关闭剩余未收数量，必须通过本命令生成 `PurchaseOrderChange`
- 具体变更 envelope 可在 realization 中细化，但不得突破本文件的边界约束

### `CancelPurchaseOrder`

- 作用：取消一个当前仍允许取消的正式采购承诺

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `purchase_order_id` | 是 | 目标 PO 标识 |
| `cancel_reason` | 是 | 取消原因 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `purchase_order` | 取消后的 `PurchaseOrder` |

关键语义：

- phase 1 只冻结“服务必须拒绝不再允许取消的 PO”这一行为边界
- 若实际收货事实已进入 `WMS`，或当前状态已不允许撤销正式承诺，服务必须拒绝取消
- 取消成功后状态必须为 `CANCELLED`

## 5. 错误语义

phase 1 management 统一暴露以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、allocation 不完整、数量非法、`TEXT` 行缺少描述、allocation source 非法、非 `GENERAL_STOCK` 缺少 `source_reference_id`，或超额 general stock 缺少 reason |
| `UNAUTHENTICATED` | 缺少有效 internal service context、operator context、trace context 或 audit context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有在该 tenant / org / PO 上执行命令的权限 |
| `NOT_FOUND` | 目标 `PurchaseOrder / PurchaseOrderLine / PurchaseRequest / PurchaseRequestLine / Item / SupplierProfile` 不存在 |
| `ALREADY_EXISTS` | 当前命令违反唯一性约束 |
| `FAILED_PRECONDITION` | 资源存在，但当前状态或外部真相不满足命令前提，例如对非 `DRAFT` 更新、对非已发 `PO` 变更、目标供应商非 `ACTIVE`、标准 Item 不可采购、目标供应商缺少 `ACTIVE SupplierOffering`，allocation 合计不等于行数量，或关闭剩余未收数量时未通过 `PurchaseOrderChange` 留痕 |
| `UNAVAILABLE` | 下游依赖或当前服务暂不可用 |
| `INTERNAL` | 未归类的服务内部错误 |

补充说明：

- 标准 `Item` 的 `SupplierOffering` 校验失败必须返回 `FAILED_PRECONDITION`
- 文本型采购不得因为缺少 `SupplierOffering` 而被拒绝
- phase 1 不冻结供应商确认回写失败或 future event 发布失败语义
