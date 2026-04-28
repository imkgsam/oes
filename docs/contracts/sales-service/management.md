# sales-service Management API

## 1. 模块职责

`SalesManagementService` 负责 phase 1 的报价、正式版本、订单成立、商业前提与 sales-side fulfillment handoff 写接口。

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

### 3.1 Quote 草稿语义

- `Quote` 草稿可反复修改
- `UpdateQuoteDraft` 只修改当前草稿，不生成 `QuoteVersion`
- 下载、预览、打印、导出不生成 `QuoteVersion`

### 3.2 QuoteVersion 语义

- 只有显式 `PublishQuote` 才生成 `QuoteVersion`
- 每次成功的 `PublishQuote` 都把当时 Quote 当前内容冻结为一份正式版本基线
- `QuoteVersion` 是客户确认、订单成立与审计留痕的稳定依据

### 3.3 SalesOrder 成立语义

- 只有显式 `ConvertQuoteVersionToOrder` 才能创建 `SalesOrder`
- `SalesOrder` 必须基于某个已发布 `QuoteVersion` 成立
- phase 1 不支持从同一 `QuoteVersion` 拆成多个订单或部分订单

### 3.4 Commercial Gate 语义

`CommercialGateSummary` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `order_established` | 订单是否已通过显式成立动作创建 |
| `production_gate` | 当前是否允许生产 |
| `stocking_gate` | 当前是否允许备货 |
| `shipping_gate` | 当前是否允许发货 |

补充说明：

- 订单成立、允许生产、允许备货、允许发货必须拆开治理
- `SetOrderCommercialGate` 只管理 `production_gate / stocking_gate / shipping_gate`
- `order_established` 只能由 `ConvertQuoteVersionToOrder` 置为成立

### 3.5 Fulfillment Handoff 语义

- `SubmitFulfillmentHandoff` 只表示 Sales 已把商业承诺交接给 fulfillment boundary
- 它不等于允许生产
- 它不等于允许备货
- 它不等于允许发货
- 它不拥有 physical release 或执行推进真相

## 4. RPC 语义

### `CreateQuote`

- 作用：创建一份新的 Quote 草稿

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `customer_tenant_party_id` | 是 | 客户主体稳定引用 |
| `opportunity_ref` | 否 | optional CRM opportunity 引用摘要 |
| `draft_lines[]` | 否 | 初始化草稿行；允许空草稿创建 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `quote` | 新建后的 `Quote` 草稿 |

空语义：

- 成功时必须返回新建 `quote`
- phase 1 允许创建空草稿；空草稿不是异常

### `UpdateQuoteDraft`

- 作用：修改某份 Quote 的当前草稿内容

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `quote_id` | 是 | 目标 Quote 标识 |
| `draft_mutation` | 是 | 草稿头信息与草稿行的本次修改内容 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `quote` | 更新后的当前 `Quote` 草稿 |

空语义：

- 成功时必须返回更新后的 `quote`
- 成功更新草稿不生成 `QuoteVersion`

### `PublishQuote`

- 作用：把当前 Quote 草稿显式发布为一份正式 `QuoteVersion`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `quote_id` | 是 | 目标 Quote 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `quote_version` | 新生成的 `QuoteVersion` |
| `quote` | 发布后仍可继续作为草稿载体存在的 `Quote` 当前摘要 |

显式版本语义：

- 只有该命令成功时才生成新的 `QuoteVersion`
- `QuoteVersion` 冻结的是发布瞬间的商业内容，而不是后续继续编辑的草稿态
- 下载、预览、打印、导出都不是 `PublishQuote`
- phase 1 不要求 `Contract / CLM` 先存在

空语义：

- 成功时必须返回新生成的 `quote_version`
- 若 Quote 当前内容不满足正式发布前提，则返回 `FAILED_PRECONDITION`

### `ConvertQuoteVersionToOrder`

- 作用：基于某个已发布 `QuoteVersion` 显式成立一份 `SalesOrder`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `quote_version_id` | 是 | 成立依据的 QuoteVersion 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `sales_order` | 新建后的 `SalesOrder` |

显式成立语义：

- 只有该命令成功时才创建 `SalesOrder`
- `sales_order.quote_version_id` 必须指向成立依据的 `QuoteVersion`
- `sales_order.lines[]` 必须把版本中的商业承诺冻结为 `SalesOrderLine`
- 成功成立后，`commercial_gate_summary.order_established = true`
- 成功成立不等于 `production_gate / stocking_gate / shipping_gate` 自动变为允许
- phase 1 同一 `QuoteVersion` 最多成立一个 `SalesOrder`
- phase 1 不要求 `Contract / CLM` 先存在

空语义：

- 成功时必须返回新建 `sales_order`
- 若同一 `QuoteVersion` 已经成立过 `SalesOrder`，返回 `ALREADY_EXISTS`
- 若目标 `QuoteVersion` 不存在，返回 `NOT_FOUND`

### `SetOrderCommercialGate`

- 作用：显式设置某份 `SalesOrder` 的商业放行结果

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `sales_order_id` | 是 | 目标 SalesOrder 标识 |
| `gate_name` | 是 | `production_gate / stocking_gate / shipping_gate` 之一 |
| `allowed` | 是 | 当前是否允许该 gate |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `sales_order_id` | 目标订单标识 |
| `commercial_gate_summary` | 更新后的完整 gate 摘要 |

关键语义：

- 该命令不创建 `SalesOrder`
- 该命令不改写 `order_established`
- gate 必须独立设置，不得把三个执行放行折叠成单一“订单已确认”

空语义：

- 成功时必须返回最新 `commercial_gate_summary`
- 若订单尚未成立，则返回 `FAILED_PRECONDITION`

### `SubmitFulfillmentHandoff`

- 作用：提交 Sales 到 fulfillment boundary 的商业交接事实

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `operator_context` | 是 | 操作人上下文 |
| `trace_context` | 是 | 链路追踪上下文 |
| `audit_context` | 是 | 审计上下文 |
| `sales_order_id` | 是 | 目标 SalesOrder 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `sales_order_id` | 目标订单标识 |
| `commercial_gate_summary` | 当前完整 gate 摘要 |
| `fulfillment_handoff_status` | handoff 提交结果摘要 |

关键语义：

- 该命令只表达 Sales handoff，不表达 fulfillment boundary 已执行接单、占用、生产放行或发运放行
- 该命令不改变 `production_gate / stocking_gate / shipping_gate`
- physical release 与执行推进归 future fulfillment boundary 拥有

空语义：

- 成功时必须返回 handoff 结果摘要
- 若订单尚未成立，则返回 `FAILED_PRECONDITION`

## 5. 错误语义

phase 1 management 只冻结以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法，或 `gate_name` 非法 |
| `UNAUTHENTICATED` | 缺少有效 operator context、trace context 或 audit context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有在该 tenant / quote / order 上执行命令的权限 |
| `NOT_FOUND` | 目标 Quote、QuoteVersion 或 SalesOrder 不存在 |
| `ALREADY_EXISTS` | 资源或一对一成立关系已存在，例如同一 `QuoteVersion` 已成立过 `SalesOrder` |
| `FAILED_PRECONDITION` | 资源存在，但当前状态不满足命令前提，例如未成立订单就设置商业 gate，或草稿内容尚不满足发布前提 |

补充说明：

- phase 1 不冻结除上述列表之外的其他错误码
- 命令成功时不得通过空响应掩盖实际结果，必须返回对应资源或结果摘要

## 6. Deferred Candidate Events

phase 1 只允许把下列事件列为候选，不得视为已冻结 event catalog：

- `QuotePublished`
- `SalesOrderEstablished`
- `SalesOrderCommercialGateUpdated`
- `SalesOrderFulfillmentHandoffSubmitted`
