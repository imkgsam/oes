# sales-service Query API

## 1. 模块职责

`SalesQueryService` 负责 phase 1 的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`SalesQueryService`
- 所有 RPC 都按 [Sales trusted execution contract](README.md#5-trusted-execution-contract) 接受 `BUSINESS / HUMAN / WEB` ExecutionToken
- tenant、operator、org、request 与 trace 来自 trusted context，不出现在 request body

phase 1 query 只覆盖：

- 当前 `Quote` 草稿读取
- `Quote` 目录搜索
- 已发布 `QuoteVersion` 读取
- `QuoteVersion` 历史列表
- 已成立 `SalesOrder` 读取
- `SalesOrder` 目录搜索

phase 1 query 不覆盖：

- 完整 pricing engine 读模型
- packaging master 读模型
- `CustomerItemMapping` 完整目录
- CLM / contract lifecycle
- fulfillment boundary 执行读模型
- finance integration 读模型
- integration events 派生读模型

## 2. 通用读取对象

### 2.1 `Quote`

phase 1 `Quote` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `quote_id` | Quote 稳定标识 |
| `quote_no` | Quote 单号摘要 |
| `tenant_id` | 显式租户边界 |
| `customer_tenant_party_id` | 客户主体稳定引用 |
| `opportunity_ref` | optional CRM opportunity 引用摘要 |
| `status` | 当前 Quote 工作态摘要 |
| `latest_published_version_id` | 最近一次正式版本；未发布时为空 |
| `lines[]` | 当前草稿行列表 |

`lines[]` 最小 shape：

| 字段 | 说明 |
| --- | --- |
| `quote_line_id` | Quote 行标识 |
| `line_no` | 行号 |
| `item_id` | Item 稳定引用 |
| `item_snapshot` | 当次草稿的 Item 摘要 |
| `sales_config_snapshot` | 销售配置快照 |
| `packaging_requirement_snapshot` | 包装要求快照 |
| `price_quantity_delivery_snapshot` | 价格 / 数量 / 交付承诺快照 |
| `customer_item_snapshot` | 客户自有 SKU / 型号 / 标签显示名快照 |

### 2.2 `QuoteVersion`

phase 1 `QuoteVersion` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `quote_version_id` | QuoteVersion 稳定标识 |
| `quote_id` | 来源 Quote 标识 |
| `quote_no` | Quote 单号摘要 |
| `version_no` | 同一 Quote 下的版本序号 |
| `tenant_id` | 显式租户边界 |
| `customer_tenant_party_id` | 客户主体稳定引用 |
| `published_at` | 正式发布时间 |
| `lines[]` | 本次正式版本冻结的行列表，最小字段集合与 `Quote.lines[]` 一致 |

说明：

- `QuoteVersion` 是显式 `PublishQuote` 的结果
- 下载、预览、打印、导出不生成 `QuoteVersion`
- `QuoteVersion` 读取的是已冻结基线，不是后续草稿态

### 2.3 `SalesOrder`

phase 1 `SalesOrder` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `sales_order_id` | SalesOrder 稳定标识 |
| `sales_order_no` | SalesOrder 单号摘要 |
| `tenant_id` | 显式租户边界 |
| `customer_tenant_party_id` | 客户主体稳定引用 |
| `quote_id` | 来源 Quote 标识 |
| `quote_version_id` | 成立依据的 QuoteVersion 标识 |
| `commercial_gate_summary` | 商业前提摘要 |
| `fulfillment_handoff_status` | Sales 侧 handoff 摘要；未提交时为空或 `NOT_SUBMITTED` |
| `lines[]` | 订单行列表，元素 shape 为 `SalesOrderLine` |

### 2.4 `SalesOrderLine`

phase 1 `SalesOrderLine` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `sales_order_line_id` | 订单行标识 |
| `line_no` | 行号 |
| `item_id` | Item 稳定引用 |
| `item_snapshot` | 成立时冻结的 Item 摘要 |
| `sales_config_snapshot` | 成立时冻结的销售配置快照 |
| `packaging_requirement_snapshot` | 成立时冻结的包装要求快照 |
| `price_quantity_delivery_snapshot` | 成立时冻结的价格 / 数量 / 交付承诺快照 |
| `customer_item_snapshot` | 成立时冻结的客户自有 SKU / 型号 / 标签显示名快照 |

### 2.5 `CommercialGateSummary`

phase 1 `CommercialGateSummary` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `order_established` | 订单是否已通过显式成立动作创建 |
| `production_gate` | 当前是否允许生产 |
| `stocking_gate` | 当前是否允许备货 |
| `shipping_gate` | 当前是否允许发货 |

说明：

- `order_established` 与其余三个 gate 必须拆开表达
- `SubmitFulfillmentHandoff` 不等于任一 gate 自动变为允许

## 3. RPC 语义

### `GetQuote`

- 作用：按 `quote_id` 读取某份 Quote 的当前草稿态

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `quote_id` | 是 | 目标 Quote 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `quote` | 单个 `Quote` 读取模型 |

空语义：

- 目标 Quote 存在时返回 `quote`
- 目标 Quote 不存在时返回 `NOT_FOUND`

### `SearchQuotes`

- 作用：按条件分页搜索 Quote 目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `keyword` | 否 | 按 `quote_no` 或客户显示摘要检索 |
| `customer_tenant_party_id` | 否 | 按客户主体过滤 |
| `status` | 否 | 按 Quote 工作态过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `quotes[]` | 当前页 Quote 摘要列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

### `GetQuoteVersion`

- 作用：按 `quote_version_id` 读取单个已发布 `QuoteVersion`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `quote_version_id` | 是 | 目标 QuoteVersion 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `quote_version` | 单个 `QuoteVersion` 读取模型 |

空语义：

- 目标 `QuoteVersion` 存在时返回 `quote_version`
- 目标 `QuoteVersion` 不存在时返回 `NOT_FOUND`

### `ListQuoteVersions`

- 作用：列出某份 Quote 的已发布版本历史

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `quote_id` | 是 | 目标 Quote 标识 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `quote_versions[]` | 当前页 `QuoteVersion` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 目标 Quote 不存在时返回 `NOT_FOUND`
- 目标 Quote 存在但尚未发布过正式版本时，返回空 `quote_versions[]`
- 分页越界时正常返回空页，不返回 `NOT_FOUND`

### `GetSalesOrder`

- 作用：按 `sales_order_id` 读取单个已成立 `SalesOrder`

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `sales_order_id` | 是 | 目标 SalesOrder 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `sales_order` | 单个 `SalesOrder` 读取模型 |

空语义：

- 目标 `SalesOrder` 存在时返回 `sales_order`
- 目标 `SalesOrder` 不存在时返回 `NOT_FOUND`

### `SearchSalesOrders`

- 作用：按条件分页搜索已成立的 SalesOrder 目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `keyword` | 否 | 按 `sales_order_no` 或客户显示摘要检索 |
| `customer_tenant_party_id` | 否 | 按客户主体过滤 |
| `quote_version_id` | 否 | 按来源 QuoteVersion 过滤 |
| `production_gate` | 否 | 按是否允许生产过滤 |
| `stocking_gate` | 否 | 按是否允许备货过滤 |
| `shipping_gate` | 否 | 按是否允许发货过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `sales_orders[]` | 当前页 SalesOrder 摘要列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

## 4. 错误语义

phase 1 query 只冻结以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法或分页参数非法 |
| `UNAUTHENTICATED` | 缺少或无法验证目标 ExecutionToken / mTLS binding |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant / quote / order 的权限 |
| `NOT_FOUND` | 单对象读取目标不存在，或 `ListQuoteVersions` 的 `quote_id` 不存在 |
| `ALREADY_EXISTS` | query RPC 不应使用该错误码；phase 1 保留但不在 query 侧展开业务语义 |
| `FAILED_PRECONDITION` | 资源存在，但当前前提不满足读取要求 |

补充说明：

- `SearchQuotes` 空页、`SearchSalesOrders` 空页、`ListQuoteVersions` 空版本列表都必须走正常响应语义
- phase 1 不冻结除上述列表之外的其他错误码
