# sales-service Pricing Query API

## 1. 模块职责

`PricingQueryService` 负责 `sales-service` phase 1 pricing capability 的只读查询能力，不修改状态。

调用基线：

- 接口类型：内部 gRPC
- 服务：`PricingQueryService`
- 所有 RPC 显式带 `tenant_id`
- 所有 RPC 都要求：
  - operator context
  - trace context
- phase 1 仅支持 `USD / CNY`

phase 1 pricing query 只覆盖：

- `PriceList` 目录搜索与明细读取
- active `CustomerPriceAgreement` 读取
- `CustomerPriceAgreement` 当前头版本 / 指定版本读取
- `CustomerPriceAgreement` 版本目录读取
- quote line pricing preview

phase 1 pricing query 不覆盖：

- 完整 pricing engine
- campaign engine、price stacking、rebate、commission
- exception workflow
- finance-service 汇率真相读取 contract
- CLM / contract lifecycle

## 2. 通用读取对象

### 2.1 `PriceList`

`PriceList` 表达标准价、活动价或展会价头信息。

phase 1 `PriceList` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `price_list_id` | `PriceList` 稳定标识 |
| `tenant_id` | 显式租户边界 |
| `price_list_name` | PriceList 显示名 |
| `price_list_type` | `STANDARD | ACTIVITY | EXHIBITION` |
| `status` | `DRAFT | ACTIVE | INACTIVE` |
| `currency_code` | 仅支持 `USD | CNY` |
| `effective_from` | 生效起点 |
| `effective_to` | optional 生效终点 |

说明：

- `ACTIVITY / EXHIBITION` 只是特殊 `PriceList` 类型，不引入 campaign engine
- phase 1 不为 `PriceList` 建独立版本历史；头信息与行内容按当前值读取

### 2.2 `PriceListLine`

`PriceListLine` 表达某个 `Item` 在某个 `PriceList` 下的销售价格与 MOQ 基线。

phase 1 `PriceListLine` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `price_list_line_id` | 行标识 |
| `line_no` | 行号 |
| `item_id` | Item 稳定引用 |
| `price_snapshot` | 该行定义的价格快照 |
| `moq_snapshot` | 该行定义的 MOQ 快照 |

说明：

- `MOQ` 属于 sales pricing，不属于 `item-master-service`
- `PriceListLine.price_snapshot.source_type` 固定为 `PRICE_LIST`
- `PriceListLine.moq_snapshot.source_type` 固定为 `PRICE_LIST`

### 2.3 `CustomerPriceAgreement`

`CustomerPriceAgreement` 读取模型按“版本视角”返回，表达某个客户在某个币种下的一版长期价格协议。

phase 1 `CustomerPriceAgreement` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_price_agreement_id` | 协议家族稳定标识 |
| `tenant_id` | 显式租户边界 |
| `customer_tenant_party_id` | 客户主体稳定引用 |
| `currency_code` | 仅支持 `USD | CNY` |
| `version_no` | 该家族内版本号，从 `1` 开始递增 |
| `status` | `DRAFT | ACTIVE | SUPERSEDED` |
| `published_at` | 当前版本发布时间；draft 为空 |
| `lines[]` | 当前版本的协议行 |

说明：

- 同一 `tenant_id + customer_tenant_party_id + currency_code` 最多只允许一个 active 协议版本
- 若存在 draft，`GetCustomerPriceAgreement` 默认返回 draft；否则返回 active

### 2.4 `CustomerPriceAgreementLine`

`CustomerPriceAgreementLine` 表达客户长期价格协议中某个 `Item` 的价格与 MOQ 基线。

phase 1 `CustomerPriceAgreementLine` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_price_agreement_line_id` | 行标识 |
| `line_no` | 行号 |
| `item_id` | Item 稳定引用 |
| `price_snapshot` | 该行定义的价格快照 |
| `moq_snapshot` | 该行定义的 MOQ 快照 |

说明：

- `CustomerPriceAgreementLine.price_snapshot.source_type` 固定为 `CUSTOMER_PRICE_AGREEMENT`
- `CustomerPriceAgreementLine.moq_snapshot.source_type` 固定为 `CUSTOMER_PRICE_AGREEMENT`

### 2.5 `PriceSnapshot`

`PriceSnapshot` 表达“当前这条销售价格快照到底是多少、币种是什么、来源是什么”。

phase 1 `PriceSnapshot` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `currency_code` | 价格币种，`USD | CNY` |
| `unit_price_amount` | 单价金额 |
| `source_type` | `CUSTOMER_PRICE_AGREEMENT | PRICE_LIST | MANUAL` |
| `source_ref_id` | 来源头对象标识；手工价时可为空 |
| `source_line_ref_id` | 来源行标识；手工价时可为空 |
| `source_version_no` | 来源版本号；仅客户协议来源必填 |
| `resolved_at` | 本快照形成时间 |

### 2.6 `MoqSnapshot`

`MoqSnapshot` 表达“当前这条销售 MOQ 基线是多少、单位是什么、来源是什么”。

phase 1 `MoqSnapshot` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `moq_quantity` | 最小起订量 |
| `quantity_uom_code` | 数量单位 |
| `source_type` | `CUSTOMER_PRICE_AGREEMENT | PRICE_LIST` |
| `source_ref_id` | 来源头对象标识 |
| `source_line_ref_id` | 来源行标识 |
| `source_version_no` | 来源版本号；仅客户协议来源必填 |
| `resolved_at` | 本快照形成时间 |

说明：

- phase 1 不冻结“独立 manual MOQ 管理”语义
- 若无法从 active 协议或 selected `PriceList` 解析 MOQ，pricing preview 必须返回 `FAILED_PRECONDITION`

### 2.7 `ExchangeRateSnapshot`

`ExchangeRateSnapshot` 表达 Sales 在 preview 时看到的汇率快照，但不转移 Finance 的汇率真相 owner。

phase 1 `ExchangeRateSnapshot` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `from_currency_code` | 原币种 |
| `to_currency_code` | 目标币种 |
| `exchange_rate_value` | 汇率值 |
| `finance_rate_ref` | optional Finance 侧汇率引用摘要 |
| `effective_at` | Finance 侧生效时间 |
| `snapshotted_at` | Sales 侧冻结时间 |

说明：

- Finance owns 汇率真相；Sales 只保存 snapshot
- 若 `from_currency_code == to_currency_code`，允许返回 `1`

### 2.8 `ExceptionPlaceholder`

`ExceptionPlaceholder` 只表达“这里需要后续异常治理”，不表达 workflow 已实现。

phase 1 `ExceptionPlaceholder` 最小读取 shape：

| 字段 | 说明 |
| --- | --- |
| `exception_type` | `LOW_PRICE | LOW_MOQ` |
| `status` | `NOT_REQUIRED | REQUIRED` |
| `baseline_source_type` | 比较基线来源；`CUSTOMER_PRICE_AGREEMENT | PRICE_LIST` |
| `baseline_value` | 价格或 MOQ 基线值 |
| `actual_value` | 当前实际值 |
| `currency_code` | 低价场景填写 |
| `quantity_uom_code` | 低 MOQ 场景填写 |
| `detected_at` | 检测时间 |

说明：

- low price 只占位，不实现审批 / workflow
- low MOQ 只占位，不实现审批 / workflow
- 一个 line 允许出现 `0..n` 个 `exception_placeholders[]`

### 2.9 `CustomerPriceAgreementVersionSummary`

phase 1 版本目录最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_price_agreement_id` | 协议家族标识 |
| `version_no` | 版本号 |
| `status` | `DRAFT | ACTIVE | SUPERSEDED` |
| `published_at` | 发布时间；draft 为空 |
| `line_count` | 行数量摘要 |

### 2.10 Snapshot 扩展绑定

phase 1 pricing preview 的返回值必须可直接冻结进 line snapshot，而不是在后续 publish / convert 时重新解释。

推荐绑定位置：

- `QuoteLine.priceQuantityDeliverySnapshot`
- `QuoteVersionLine.priceQuantityDeliverySnapshot`
- `SalesOrderLine.priceQuantityDeliverySnapshot`

必须冻结的 pricing 子字段：

- `price_snapshot.*`
- `moq_snapshot.*`
- `exchange_rate_snapshot.*`
- `exception_placeholders[]`

补充说明：

- `QuoteLine` 保存当前工作态 pricing snapshot
- `PublishQuote` 时，`QuoteVersionLine` 复制当时的 `QuoteLine` pricing snapshot
- `ConvertQuoteVersionToOrder` 时，`SalesOrderLine` 复制对应 `QuoteVersionLine` pricing snapshot，不重新回源解析协议、价目表或汇率

## 3. RPC 语义

### `SearchPriceLists`

- 作用：按条件分页搜索 `PriceList` 目录

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `keyword` | 否 | 按 `price_list_name` 检索 |
| `price_list_type` | 否 | `STANDARD | ACTIVITY | EXHIBITION` |
| `status` | 否 | `DRAFT | ACTIVE | INACTIVE` |
| `currency_code` | 否 | `USD | CNY` |
| `effective_at` | 否 | 按某个时间点过滤生效中的 PriceList |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `price_lists[]` | 当前页 `PriceList` 摘要列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 搜索结果为空时正常返回空页
- 空页不是异常，不返回 `NOT_FOUND`

### `GetPriceList`

- 作用：按 `price_list_id` 读取单个 `PriceList` 头信息

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `price_list_id` | 是 | 目标 `PriceList` 标识 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `price_list` | 单个 `PriceList` 读取模型 |

空语义：

- 目标 `PriceList` 不存在时返回 `NOT_FOUND`

### `GetPriceListLines`

- 作用：分页读取某个 `PriceList` 的行列表

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `price_list_id` | 是 | 目标 `PriceList` 标识 |
| `item_id` | 否 | 按 `Item` 精确过滤 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `price_list_lines[]` | 当前页 `PriceListLine` 列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- `price_list_id` 不存在时返回 `NOT_FOUND`
- `PriceList` 存在但没有任何行时返回空页

### `GetActiveCustomerPriceAgreement`

- 作用：按 `customer_tenant_party_id + currency_code` 读取当前 active 的客户长期价格协议

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `customer_tenant_party_id` | 是 | 客户主体稳定引用 |
| `currency_code` | 是 | `USD | CNY` |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_price_agreement` | active `CustomerPriceAgreement` |

空语义：

- 若当前没有 active 版本，返回 `NOT_FOUND`
- draft 版本存在但尚未 publish，不等于 active

### `GetCustomerPriceAgreement`

- 作用：按协议家族标识读取当前头版本或指定版本

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `customer_price_agreement_id` | 是 | 协议家族标识 |
| `version_no` | 否 | 指定版本；为空时默认读取当前头版本 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `customer_price_agreement` | `CustomerPriceAgreement` 读取模型 |

读取规则：

- `version_no` 为空且存在 draft 时，返回 draft
- `version_no` 为空且不存在 draft 时，返回 active
- `version_no` 指定时，返回对应历史版本

空语义：

- 协议家族不存在时返回 `NOT_FOUND`
- 指定 `version_no` 不存在时返回 `NOT_FOUND`

### `ListCustomerPriceAgreementVersions`

- 作用：列出某个协议家族下的版本历史

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `customer_price_agreement_id` | 是 | 协议家族标识 |
| `page` | 否 | 1-based 页码 |
| `page_size` | 否 | 页大小 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `versions[]` | 当前页版本摘要列表 |
| `total` | 总条数 |
| `page` | 当前页码 |
| `page_size` | 当前页大小 |

空语义：

- 协议家族不存在时返回 `NOT_FOUND`
- 协议家族存在但只有一版时，仍正常返回单条结果

### `PreviewQuoteLinePricing`

- 作用：在不创建或修改 Quote 的前提下，预览单个 quote line 的 pricing 解析结果

请求最小 shape：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `tenant_id` | 是 | 显式租户边界 |
| `customer_tenant_party_id` | 是 | 客户主体稳定引用 |
| `item_id` | 是 | 目标 Item |
| `currency_code` | 是 | 交易币种，`USD | CNY` |
| `requested_quantity` | 是 | 本次报价数量 |
| `quantity_uom_code` | 是 | 本次报价数量单位 |
| `selected_price_list_id` | 否 | 调用方显式选中的 `PriceList` |
| `manual_unit_price_amount` | 否 | 调用方手工输入单价 |
| `pricing_at` | 否 | 预览时点；为空时按当前业务时间解析 |
| `exchange_rate_target_currency_code` | 否 | 需要一并冻结汇率快照时的目标币种 |

响应最小 shape：

| 字段 | 说明 |
| --- | --- |
| `price_snapshot` | 最终拟应用的价格快照 |
| `moq_snapshot` | 当前解析出的 MOQ 快照 |
| `exchange_rate_snapshot` | 当前冻结的汇率快照 |
| `exception_placeholders[]` | low price / low MOQ 占位结果 |

解析规则：

- 价格基线解析优先级：
  - active `CustomerPriceAgreement`
  - selected `PriceList`
- 若存在 `manual_unit_price_amount`，允许把最终 `price_snapshot.source_type` 置为 `MANUAL`
- 低价判断只在“存在协议 / 价目表基线且手工价低于该基线”时产生 `LOW_PRICE`
- 低 MOQ 判断只在“`requested_quantity` 低于 `moq_snapshot.moq_quantity`”时产生 `LOW_MOQ`
- 无法解析 `moq_snapshot` 时，必须返回 `FAILED_PRECONDITION`
- preview 只返回建议快照，不创建 QuoteLine，不写持久化状态
- preview 返回的四组字段就是后续 line snapshot 的 pricing 子结构

## 4. 错误语义

phase 1 pricing query 只冻结以下错误面：

| 错误码 | 语义 |
| --- | --- |
| `INVALID_ARGUMENT` | 请求字段缺失、格式非法、分页参数非法、币种不在 `USD / CNY` 内 |
| `UNAUTHENTICATED` | 缺少有效 operator context 或 trace context |
| `PERMISSION_DENIED` | 调用方存在上下文，但没有读取该 tenant pricing 资源的权限 |
| `NOT_FOUND` | 单对象读取目标不存在，或 active 协议不存在 |
| `ALREADY_EXISTS` | query RPC 不应使用该错误码；phase 1 保留但不展开业务语义 |
| `FAILED_PRECONDITION` | 资源存在，但前提不满足，例如 preview 无法解析 `moq_snapshot` |

补充说明：

- `SearchPriceLists` 空页、`GetPriceListLines` 空页、`ListCustomerPriceAgreementVersions` 空页都必须走正常响应语义
- phase 1 不冻结除上述列表之外的其他错误码
